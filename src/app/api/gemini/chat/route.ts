import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

async function callGeminiWithRetry(
  model: GenerativeModel,
  prompt: string,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      const status = error?.status;
      const msg = error?.message || '';
      const is429 = status === 429 || msg.includes('429');
      const isQuota = msg.includes('quota') || msg.includes('rate limit');

      if ((is429 || isQuota) && attempt < maxRetries) {
        const delay = 2000 * Math.pow(2, attempt);
        console.warn(`Gemini rate limited (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      throw error;
    }
  }
  throw new Error('Gemini API rate limit exceeded after retries. Please try again later.');
}

export async function POST(request: NextRequest) {
  try {
    const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    if (!GEMINI_API_KEY.startsWith('AIza')) {
      return NextResponse.json(
        { error: 'Invalid Gemini API key format. Key should start with "AIza".' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // If guided mode context is provided, add teaching context
    const guidedContext = context?.guidedModeContext
      ? `\nCurrent teaching context: ${context.guidedModeContext}\nPlease tailor your response to help the user understand this specific concept as part of their guided learning experience.\n`
      : '';

    // Create system prompt with restrictions
    const systemPrompt = `You are a helpful financial education assistant for StockMind, a stock and crypto learning platform.

IMPORTANT RESTRICTIONS:
- You MUST NOT provide buy/sell recommendations
- You MUST NOT predict future prices
- You MUST NOT provide investment advice
- You MUST NOT make claims about guaranteed returns
- You MUST NOT hallucinate live market data

You CAN:
- Explain financial concepts and terms
- Describe how markets work
- Help users understand charts and indicators
- Answer questions about the StockMind platform
- Provide general education about investing

RESPONSE STYLE:
- Keep answers short — 2-4 sentences for simple questions, up to a short paragraph for complex ones
- Use simple, everyday language that a complete beginner can understand
- Give the core meaning first, then a brief plain-English explanation
- Avoid long bullet lists, sub-sections, or walls of text
- Do not over-explain or list every possible detail — just cover what was asked
${guidedContext}
User question: ${message}`;

    const text = await callGeminiWithRetry(model, systemPrompt);

    return NextResponse.json({
      response: text,
      suggestions: [],
    });
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    const errorName = error?.name || 'Error';
    console.error(`Gemini chat error [${errorName}]: ${errorMessage}`);
    console.error('Full error:', error);
    return NextResponse.json(
      { error: `Chat failed: ${errorMessage}`, errorType: errorName },
      { status: 500 }
    );
  }
}
