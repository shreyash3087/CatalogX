import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { instruction } = await req.json();
    
    if (!instruction || typeof instruction !== 'string') {
      return NextResponse.json({ error: 'Instruction string is required' }, { status: 400 });
    }

    const rootDir = path.resolve(/* turbopackIgnore: true */ process.cwd(), '..');
    const agentCwd = path.join(/* turbopackIgnore: true */ rootDir, 'buyer-agent');
    const agentScript = path.join(/* turbopackIgnore: true */ agentCwd, 'src', 'index.js');

    console.log(`[Dashboard API] Spawning Agent for instruction: "${instruction}"`);

    const safeInstruction = instruction.replace(/"/g, '\\"');
    const cmd = `node "${agentScript}" "${safeInstruction}"`;

    exec(cmd, { cwd: agentCwd, env: process.env }, (error) => {
      if (error) {
        console.error('[Dashboard API] Agent process error:', error);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Agent started successfully in background.',
    });
  } catch (err: any) {
    console.error('[Dashboard API] Failed to start agent:', err);
    return NextResponse.json({ error: 'Failed to start agent', details: err.message }, { status: 500 });
  }
}
