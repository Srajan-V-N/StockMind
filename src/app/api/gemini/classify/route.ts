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

    const body = await request.json();
    const { companyName, description } = body;

    if (!companyName || !description) {
      return NextResponse.json(
        { error: 'Company name and description are required' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Analyze this company and identify between 3 and 5 DISTINCT business sectors it operates in. For each sector, list EXACTLY 3 direct competitors that are publicly traded.

Company: ${companyName}
Description: ${description}

EXAMPLE: Amazon operates in E-commerce, Cloud Computing (AWS), Digital Streaming, Logistics, and AI/Machine Learning — each sector has different competitors.

EXAMPLE: Apple operates in Consumer Electronics, Software/Services, Digital Payments, and Semiconductors.

EXAMPLE: Reliance Industries operates in Oil & Gas Refining, Telecommunications (Jio), Retail (Reliance Retail), Digital Services, and Petrochemicals — each sector has different competitors.

EXAMPLE: Tata Consultancy Services operates in IT Services, Business Process Outsourcing, Cloud & Infrastructure, and Digital Transformation Consulting.

EXAMPLE: HDFC Bank operates in Retail Banking, Corporate Banking, Treasury & Markets, and Digital Banking.

Return ONLY valid JSON in this exact format with NO additional text:
{
  "sectors": [
    {
      "name": "Sector Name",
      "competitors": [
        {"name": "Company Name", "symbol": "TICKER"},
        {"name": "Company Name 2", "symbol": "TICKER2"},
        {"name": "Company Name 3", "symbol": "TICKER3"}
      ]
    }
  ]
}

STRICT RULES:
- Return 3 to 5 distinct sectors. Do NOT combine sectors. Each sector must represent a separate line of business.
- For Indian conglomerates and large diversified companies, identify ALL distinct business verticals (aim for 4-5 sectors).
- Each sector MUST have EXACTLY 3 competitors. No more, no less.
- Always provide the official stock ticker symbol (e.g., AAPL for Apple, MSFT for Microsoft, GOOGL for Alphabet)
- For Indian stocks listed on NSE, append .NS suffix (e.g., RELIANCE.NS, TCS.NS, INFY.NS)
- For Indian stocks listed on BSE only, append .BO suffix
- For Indian companies, competitors should primarily be other Indian listed companies with .NS suffixes where applicable
- Only include publicly traded companies with valid ticker symbols
- Do NOT include the original company (${companyName}) as a competitor
- Do NOT repeat the same competitor across different sectors unless they truly compete in that specific sector`;

    let text = await callGeminiWithRetry(model, prompt);

    // Clean up response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      // Return fallback structure
      return NextResponse.json({
        sectors: [
          {
            name: 'General',
            competitors: [],
          },
        ],
      });
    }
  } catch (error) {
    console.error('Gemini classify error:', error);
    return NextResponse.json(
      { error: 'Failed to classify sectors' },
      { status: 500 }
    );
  }
}
