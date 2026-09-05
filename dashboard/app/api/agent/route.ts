import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { instruction, sessionId, userProfile } = await req.json();

    if (!instruction || typeof instruction !== 'string') {
      return NextResponse.json({ error: 'Instruction string is required' }, { status: 400 });
    }

    const rootDir = path.resolve(process.cwd(), '..');
    const agentCwd = path.join(rootDir, 'buyer-agent');
    const agentScript = path.join(agentCwd, 'src', 'index.js');

    console.log(`[Dashboard API] Spawning Agent for session ${sessionId || 'new'}: "${instruction}"`);

    const safeInstruction = instruction.replace(/"/g, '\\"');
    const cmd = `node "${agentScript}" "${safeInstruction}"`;

    const envVars: NodeJS.ProcessEnv = {
      ...process.env,
      AGENT_SESSION_ID: sessionId || '',
    };

    if (userProfile) {
      envVars.CATALOGX_USER_PROFILE = JSON.stringify(userProfile);
    }

    exec(
      cmd,
      {
        cwd: agentCwd,
        env: envVars,
      },
      (error: Error | null) => {
        if (error) {
          console.error('[Dashboard API] Agent process error:', error);
        }
      }
    );

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
