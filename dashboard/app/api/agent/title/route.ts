import { NextRequest, NextResponse } from 'next/server';

function extractSmartTitle(text: string): string {
  if (!text) return 'New Chat';
  const clean = text
    .replace(/^(i want to|can you|please|buy me|find me|get me|look for|search for|buy|find|get)\s+/gi, '')
    .replace(/\s+(under|below|less than)\s+.*$/gi, '')
    .trim();

  const words = clean.split(/\s+/).filter(Boolean).slice(0, 3);
  if (words.length > 0) {
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
  return 'Shopping Session';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body?.message;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ title: 'New Chat' });
    }

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5.4-nano';
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2025-03-01-preview';

    if (endpoint && apiKey) {
      try {
        const cleanEndpoint = endpoint.replace(/\/+$/, '');
        const url = `${cleanEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content:
                  'You generate concise 2 to 3 word shopping topic titles. Return ONLY the title with no quotes, no periods, and no markdown. Examples: "Flagship Shoes", "Wireless Earbuds", "Mechanical Keyboards".',
              },
              {
                role: 'user',
                content: `Summarize this shopping conversation into a 2-3 word title:\n${message}`,
              },
            ],
            max_completion_tokens: 20,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const cleanTitle = (data.choices?.[0]?.message?.content || '')
            .trim()
            .replace(/^["'`]|["'`]$/g, '')
            .replace(/[.]+$/, '');

          if (cleanTitle && cleanTitle.length > 2 && cleanTitle.length < 35) {
            return NextResponse.json({ title: cleanTitle });
          }
        }
      } catch (llmErr) {
        console.warn('[Agent Title] Azure OpenAI fetch notice:', (llmErr as Error).message);
      }
    }

    const smartFallback = extractSmartTitle(message);
    return NextResponse.json({ title: smartFallback });
  } catch (err: any) {
    return NextResponse.json({ title: 'New Chat' });
  }
}
