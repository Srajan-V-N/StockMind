import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000';

/**
 * Wikipedia API Route
 *
 * Per B.md: Returns proper success/failure status so frontend can decide
 * how to handle missing data, rather than fabricating placeholder descriptions.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter is required',
          data: null
        },
        { status: 400 }
      );
    }

    // Call Python HTTP server instead of spawning process
    const response = await fetch(
      `${PYTHON_SERVER_URL}/api/wikipedia?query=${encodeURIComponent(query)}`,
      {
        signal: AbortSignal.timeout(10000), // 10s timeout
      }
    );

    if (!response.ok) {
      console.error(`Python server returned ${response.status}`);
      return NextResponse.json({
        success: false,
        error: 'Wikipedia lookup failed',
        data: null
      });
    }

    const result = await response.json();

    if (result.error) {
      return NextResponse.json({
        success: false,
        error: result.error,
        data: null
      });
    }

    // Successful result
    return NextResponse.json({
      success: true,
      data: {
        summary: result.summary,
        fullText: result.fullText,
        url: result.url,
        title: result.title
      }
    });
  } catch (error: any) {
    console.error('Wikipedia API error:', error);

    // Check if Python server is not running
    if (error?.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json({
        success: false,
        error: 'Python server is not running',
        data: null
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Wikipedia data',
      data: null
    });
  }
}
