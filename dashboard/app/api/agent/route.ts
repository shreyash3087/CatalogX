import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { instruction } = await req.json();
    
    if (!instruction || typeof instruction !== 'string') {
      return NextResponse.json({ error: 'Instruction string is required' }, { status: 400 });
    }

    const agentScriptPath = path.resolve(process.cwd(), '../buyer-agent/src/index.js');
    const agentCwd = path.resolve(process.cwd(), '../buyer-agent');

    console.log(`[Dashboard API] Spawning Agent for instruction: "${instruction}"`);
    console.log(`[Dashboard API] Script Path: ${agentScriptPath}`);

    // Spawn agent process in the background. It will execute, hit the DB,
    // hit Razorpay, and push audit events to /api/audit/agent,
    // which in turn broadcasts them over WebSockets to the client.
    const child = spawn('node', [agentScriptPath, instruction], {
      cwd: agentCwd,
      env: {
        ...process.env,
        // Enforce port 3001 as primary server URL
        MERCHANT_SERVER_URL: 'http://localhost:3001',
      },
      detached: true,
      stdio: 'ignore', // Ignore stdio to allow parent to exit
    });

    child.unref();

    return NextResponse.json({
      success: true,
      message: 'Agent started successfully in background.',
    });
  } catch (err: any) {
    console.error('[Dashboard API] Failed to spawn agent:', err);
    return NextResponse.json({ error: 'Failed to start agent', details: err.message }, { status: 500 });
  }
}
