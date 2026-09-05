import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { instruction, sessionId, userProfile } = await req.json();

    if (!instruction || typeof instruction !== 'string') {
      return new Response(JSON.stringify({ error: 'Instruction string is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (userProfile) {
      process.env.CATALOGX_USER_PROFILE = JSON.stringify(userProfile);
    }

    console.log(`[Dashboard API] Direct Agent execution for session ${sessionId || 'new'}: "${instruction}"`);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const originalLog = console.log;
        const originalError = console.error;

        try {
          console.log = (...args: any[]) => {
            const text = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'stdout', text })}\n\n`));
            originalLog(...args);
          };

          console.error = (...args: any[]) => {
            const text = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'stderr', text })}\n\n`));
            originalError(...args);
          };

          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { BuyerAgent } = require('@/lib/agent/core');
          const agent = new BuyerAgent(sessionId, userProfile?.email || 'user_shreyash_001');

          await agent.run(instruction);

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', code: 0 })}\n\n`));
        } catch (execErr: any) {
          originalError('[Agent Execution Error]:', execErr);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: execErr.message })}\n\n`));
        } finally {
          console.log = originalLog;
          console.error = originalError;
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('[Dashboard API] Failed to start agent:', err);
    return new Response(JSON.stringify({ error: 'Failed to start agent', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
