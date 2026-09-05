import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { instruction, sessionId, userProfile } = await req.json();

    if (!instruction || typeof instruction !== 'string') {
      return NextResponse.json({ error: 'Instruction string is required' }, { status: 400 });
    }

    if (userProfile) {
      process.env.CATALOGX_USER_PROFILE = JSON.stringify(userProfile);
    }

    console.log(`[Dashboard API] In-process Agent execution for session ${sessionId || 'new'}: "${instruction}"`);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { BuyerAgent } = require('@/lib/agent/core');
    const agent = new BuyerAgent(sessionId, userProfile?.email || 'user_shreyash_001');

    // Run agent in background / non-blocking
    agent.run(instruction).catch((err: any) => {
      console.error('[Dashboard API Agent run error]:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Agent started successfully in background.',
      sessionId,
    });
  } catch (err: any) {
    console.error('[Dashboard API] Failed to start agent:', err);
    return NextResponse.json({ error: 'Failed to start agent', details: err.message }, { status: 500 });
  }
}
