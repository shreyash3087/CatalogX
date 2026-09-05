import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

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

    const rootDir = process.cwd().includes('dashboard')
      ? path.resolve(process.cwd(), '..')
      : process.cwd();
    const agentCwd = path.resolve(rootDir, 'buyer-agent');
    const agentScript = path.resolve(agentCwd, 'src', 'index.js');

    console.log(`[Dashboard API] Streaming Agent run for session ${sessionId || 'new'}: "${instruction}"`);

    const envVars: NodeJS.ProcessEnv = {
      ...process.env,
      AGENT_SESSION_ID: sessionId || '',
      FORCE_COLOR: '0',
    };

    if (userProfile) {
      envVars.CATALOGX_USER_PROFILE = JSON.stringify(userProfile);
    }

    const child = spawn('node', [agentScript, instruction], {
      cwd: agentCwd,
      env: envVars,
    });

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        child.stdout.on('data', (data) => {
          const text = data.toString();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'stdout', text })}\n\n`));
        });

        child.stderr.on('data', (data) => {
          const text = data.toString();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'stderr', text })}\n\n`));
        });

        child.on('close', (code) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', code })}\n\n`));
          controller.close();
        });

        child.on('error', (err) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`));
          controller.close();
        });
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
