import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache competitors data for 5 minutes
const COMPETITORS_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fallback competitors when Gemini AI is unavailable
// Format: { name: company name, symbol: stock ticker }
const FALLBACK_COMPETITORS: Record<string, { sector: string; competitors: { name: string; symbol: string }[] }[]> = {
  'AAPL': [
    { sector: 'Consumer Electronics', competitors: [
      { name: 'Samsung Electronics', symbol: 'SSNLF' },
      { name: 'Sony', symbol: 'SONY' },
      { name: 'Dell Technologies', symbol: 'DELL' },
    ]},
    { sector: 'Software & Services', competitors: [
      { name: 'Microsoft', symbol: 'MSFT' },
      { name: 'Alphabet', symbol: 'GOOGL' },
      { name: 'Spotify', symbol: 'SPOT' },
    ]},
    { sector: 'Semiconductors', competitors: [
      { name: 'Qualcomm', symbol: 'QCOM' },
      { name: 'Intel', symbol: 'INTC' },
      { name: 'AMD', symbol: 'AMD' },
    ]},
    { sector: 'Digital Payments', competitors: [
      { name: 'PayPal', symbol: 'PYPL' },
      { name: 'Block', symbol: 'SQ' },
      { name: 'Visa', symbol: 'V' },
    ]},
  ],
  'MSFT': [
    { sector: 'Cloud Computing', competitors: [
      { name: 'Amazon', symbol: 'AMZN' },
      { name: 'Alphabet', symbol: 'GOOGL' },
      { name: 'Oracle', symbol: 'ORCL' },
    ]},
    { sector: 'Enterprise Software', competitors: [
      { name: 'Salesforce', symbol: 'CRM' },
      { name: 'SAP', symbol: 'SAP' },
      { name: 'Adobe', symbol: 'ADBE' },
    ]},
    { sector: 'Gaming', competitors: [
      { name: 'Sony', symbol: 'SONY' },
      { name: 'Nintendo', symbol: 'NTDOY' },
      { name: 'Electronic Arts', symbol: 'EA' },
    ]},
    { sector: 'AI & Machine Learning', competitors: [
      { name: 'Alphabet', symbol: 'GOOGL' },
      { name: 'NVIDIA', symbol: 'NVDA' },
      { name: 'Meta Platforms', symbol: 'META' },
    ]},
  ],
  'GOOGL': [
    { sector: 'Digital Advertising', competitors: [
      { name: 'Meta Platforms', symbol: 'META' },
      { name: 'Amazon', symbol: 'AMZN' },
      { name: 'The Trade Desk', symbol: 'TTD' },
    ]},
    { sector: 'Cloud Computing', competitors: [
      { name: 'Amazon', symbol: 'AMZN' },
      { name: 'Microsoft', symbol: 'MSFT' },
      { name: 'Oracle', symbol: 'ORCL' },
    ]},
    { sector: 'Mobile Operating Systems', competitors: [
      { name: 'Apple', symbol: 'AAPL' },
      { name: 'Samsung Electronics', symbol: 'SSNLF' },
      { name: 'Microsoft', symbol: 'MSFT' },
    ]},
    { sector: 'AI & Machine Learning', competitors: [
      { name: 'Microsoft', symbol: 'MSFT' },
      { name: 'NVIDIA', symbol: 'NVDA' },
      { name: 'Meta Platforms', symbol: 'META' },
    ]},
  ],
  'AMZN': [
    { sector: 'E-commerce', competitors: [
      { name: 'Walmart', symbol: 'WMT' },
      { name: 'Shopify', symbol: 'SHOP' },
      { name: 'eBay', symbol: 'EBAY' },
    ]},
    { sector: 'Cloud Computing', competitors: [
      { name: 'Microsoft', symbol: 'MSFT' },
      { name: 'Alphabet', symbol: 'GOOGL' },
      { name: 'Oracle', symbol: 'ORCL' },
    ]},
    { sector: 'Digital Streaming', competitors: [
      { name: 'Netflix', symbol: 'NFLX' },
      { name: 'Disney', symbol: 'DIS' },
      { name: 'Warner Bros Discovery', symbol: 'WBD' },
    ]},
    { sector: 'Logistics & Delivery', competitors: [
      { name: 'FedEx', symbol: 'FDX' },
      { name: 'UPS', symbol: 'UPS' },
      { name: 'DHL (Deutsche Post)', symbol: 'DPSGY' },
    ]},
  ],
  'META': [
    { sector: 'Social Media', competitors: [
      { name: 'Alphabet', symbol: 'GOOGL' },
      { name: 'Snap', symbol: 'SNAP' },
      { name: 'Pinterest', symbol: 'PINS' },
    ]},
    { sector: 'Digital Advertising', competitors: [
      { name: 'Alphabet', symbol: 'GOOGL' },
      { name: 'Amazon', symbol: 'AMZN' },
      { name: 'The Trade Desk', symbol: 'TTD' },
    ]},
    { sector: 'Virtual Reality / Metaverse', competitors: [
      { name: 'Apple', symbol: 'AAPL' },
      { name: 'Sony', symbol: 'SONY' },
      { name: 'Microsoft', symbol: 'MSFT' },
    ]},
    { sector: 'AI & Machine Learning', competitors: [
      { name: 'Alphabet', symbol: 'GOOGL' },
      { name: 'Microsoft', symbol: 'MSFT' },
      { name: 'NVIDIA', symbol: 'NVDA' },
    ]},
  ],
  'TSLA': [
    { sector: 'Electric Vehicles', competitors: [
      { name: 'Ford', symbol: 'F' },
      { name: 'General Motors', symbol: 'GM' },
      { name: 'Rivian', symbol: 'RIVN' },
    ]},
    { sector: 'Energy Storage', competitors: [
      { name: 'Enphase Energy', symbol: 'ENPH' },
      { name: 'SolarEdge', symbol: 'SEDG' },
      { name: 'NextEra Energy', symbol: 'NEE' },
    ]},
    { sector: 'Autonomous Driving', competitors: [
      { name: 'Alphabet (Waymo)', symbol: 'GOOGL' },
      { name: 'Mobileye', symbol: 'MBLY' },
      { name: 'NVIDIA', symbol: 'NVDA' },
    ]},
  ],
  'NVDA': [
    { sector: 'GPU & Semiconductors', competitors: [
      { name: 'AMD', symbol: 'AMD' },
      { name: 'Intel', symbol: 'INTC' },
      { name: 'Qualcomm', symbol: 'QCOM' },
    ]},
    { sector: 'AI Infrastructure', competitors: [
      { name: 'Broadcom', symbol: 'AVGO' },
      { name: 'Marvell Technology', symbol: 'MRVL' },
      { name: 'AMD', symbol: 'AMD' },
    ]},
    { sector: 'Data Center', competitors: [
      { name: 'Intel', symbol: 'INTC' },
      { name: 'Broadcom', symbol: 'AVGO' },
      { name: 'Arista Networks', symbol: 'ANET' },
    ]},
  ],
  'AMD': [
    { sector: 'Semiconductors', competitors: [
      { name: 'NVIDIA', symbol: 'NVDA' },
      { name: 'Intel', symbol: 'INTC' },
      { name: 'Qualcomm', symbol: 'QCOM' },
    ]},
    { sector: 'Data Center Processors', competitors: [
      { name: 'Intel', symbol: 'INTC' },
      { name: 'NVIDIA', symbol: 'NVDA' },
      { name: 'Broadcom', symbol: 'AVGO' },
    ]},
    { sector: 'Gaming Hardware', competitors: [
      { name: 'NVIDIA', symbol: 'NVDA' },
      { name: 'Intel', symbol: 'INTC' },
      { name: 'Micron', symbol: 'MU' },
    ]},
  ],
  'NFLX': [
    { sector: 'Video Streaming', competitors: [
      { name: 'Disney', symbol: 'DIS' },
      { name: 'Warner Bros Discovery', symbol: 'WBD' },
      { name: 'Comcast', symbol: 'CMCSA' },
    ]},
    { sector: 'Content Production', competitors: [
      { name: 'Disney', symbol: 'DIS' },
      { name: 'Lionsgate', symbol: 'LGF.A' },
      { name: 'Paramount', symbol: 'PARA' },
    ]},
    { sector: 'Digital Entertainment', competitors: [
      { name: 'Spotify', symbol: 'SPOT' },
      { name: 'Apple', symbol: 'AAPL' },
      { name: 'Amazon', symbol: 'AMZN' },
    ]},
  ],
  'JPM': [
    { sector: 'Commercial Banking', competitors: [
      { name: 'Bank of America', symbol: 'BAC' },
      { name: 'Wells Fargo', symbol: 'WFC' },
      { name: 'Citigroup', symbol: 'C' },
    ]},
    { sector: 'Investment Banking', competitors: [
      { name: 'Goldman Sachs', symbol: 'GS' },
      { name: 'Morgan Stanley', symbol: 'MS' },
      { name: 'Bank of America', symbol: 'BAC' },
    ]},
    { sector: 'Asset Management', competitors: [
      { name: 'BlackRock', symbol: 'BLK' },
      { name: 'Charles Schwab', symbol: 'SCHW' },
      { name: 'State Street', symbol: 'STT' },
    ]},
  ],
  'V': [
    { sector: 'Payments', competitors: [
      { name: 'Mastercard', symbol: 'MA' },
      { name: 'American Express', symbol: 'AXP' },
      { name: 'PayPal', symbol: 'PYPL' },
    ]},
    { sector: 'Fintech', competitors: [
      { name: 'Block', symbol: 'SQ' },
      { name: 'Fiserv', symbol: 'FI' },
      { name: 'Global Payments', symbol: 'GPN' },
    ]},
  ],
  'JNJ': [
    { sector: 'Pharmaceuticals', competitors: [
      { name: 'Pfizer', symbol: 'PFE' },
      { name: 'Merck', symbol: 'MRK' },
      { name: 'AbbVie', symbol: 'ABBV' },
    ]},
    { sector: 'Medical Devices', competitors: [
      { name: 'Medtronic', symbol: 'MDT' },
      { name: 'Abbott Labs', symbol: 'ABT' },
      { name: 'Boston Scientific', symbol: 'BSX' },
    ]},
    { sector: 'Consumer Health', competitors: [
      { name: 'Procter & Gamble', symbol: 'PG' },
      { name: 'Unilever', symbol: 'UL' },
      { name: 'Colgate-Palmolive', symbol: 'CL' },
    ]},
  ],
  'WMT': [
    { sector: 'Retail', competitors: [
      { name: 'Target', symbol: 'TGT' },
      { name: 'Costco', symbol: 'COST' },
      { name: 'Kroger', symbol: 'KR' },
    ]},
    { sector: 'E-commerce', competitors: [
      { name: 'Amazon', symbol: 'AMZN' },
      { name: 'Shopify', symbol: 'SHOP' },
      { name: 'eBay', symbol: 'EBAY' },
    ]},
    { sector: 'Grocery', competitors: [
      { name: 'Kroger', symbol: 'KR' },
      { name: 'Costco', symbol: 'COST' },
      { name: 'Albertsons', symbol: 'ACI' },
    ]},
  ],
  'KO': [
    { sector: 'Beverages', competitors: [
      { name: 'PepsiCo', symbol: 'PEP' },
      { name: 'Monster Beverage', symbol: 'MNST' },
      { name: 'Keurig Dr Pepper', symbol: 'KDP' },
    ]},
    { sector: 'Consumer Staples', competitors: [
      { name: 'PepsiCo', symbol: 'PEP' },
      { name: 'Procter & Gamble', symbol: 'PG' },
      { name: 'Unilever', symbol: 'UL' },
    ]},
  ],
  'DIS': [
    { sector: 'Streaming', competitors: [
      { name: 'Netflix', symbol: 'NFLX' },
      { name: 'Warner Bros Discovery', symbol: 'WBD' },
      { name: 'Comcast', symbol: 'CMCSA' },
    ]},
    { sector: 'Theme Parks & Experiences', competitors: [
      { name: 'Comcast (Universal)', symbol: 'CMCSA' },
      { name: 'SeaWorld', symbol: 'SEAS' },
      { name: 'Six Flags', symbol: 'FUN' },
    ]},
    { sector: 'Film & Television Production', competitors: [
      { name: 'Warner Bros Discovery', symbol: 'WBD' },
      { name: 'Paramount', symbol: 'PARA' },
      { name: 'Lionsgate', symbol: 'LGF.A' },
    ]},
  ],
  'RELIANCE.NS': [
    { sector: 'Oil & Gas Refining', competitors: [
      { name: 'ONGC', symbol: 'ONGC.NS' },
      { name: 'Indian Oil', symbol: 'IOC.NS' },
      { name: 'BPCL', symbol: 'BPCL.NS' },
    ]},
    { sector: 'Telecommunications', competitors: [
      { name: 'Bharti Airtel', symbol: 'BHARTIARTL.NS' },
      { name: 'Vodafone Idea', symbol: 'IDEA.NS' },
      { name: 'Tata Communications', symbol: 'TATACOMM.NS' },
    ]},
    { sector: 'Retail', competitors: [
      { name: 'Trent', symbol: 'TRENT.NS' },
      { name: 'Avenue Supermarts', symbol: 'DMART.NS' },
      { name: 'Titan Company', symbol: 'TITAN.NS' },
    ]},
    { sector: 'Digital Services', competitors: [
      { name: 'Paytm', symbol: 'PAYTM.NS' },
      { name: 'Info Edge', symbol: 'NAUKRI.NS' },
      { name: 'Zomato', symbol: 'ZOMATO.NS' },
    ]},
    { sector: 'Petrochemicals', competitors: [
      { name: 'Tata Chemicals', symbol: 'TATACHEM.NS' },
      { name: 'SRF', symbol: 'SRF.NS' },
      { name: 'Aarti Industries', symbol: 'AARTIIND.NS' },
    ]},
  ],
  'TCS.NS': [
    { sector: 'IT Services', competitors: [
      { name: 'Infosys', symbol: 'INFY.NS' },
      { name: 'Wipro', symbol: 'WIPRO.NS' },
      { name: 'HCL Technologies', symbol: 'HCLTECH.NS' },
    ]},
    { sector: 'Consulting', competitors: [
      { name: 'Accenture', symbol: 'ACN' },
      { name: 'Cognizant', symbol: 'CTSH' },
      { name: 'Infosys', symbol: 'INFY.NS' },
    ]},
    { sector: 'Cloud & Infrastructure', competitors: [
      { name: 'Tech Mahindra', symbol: 'TECHM.NS' },
      { name: 'Mphasis', symbol: 'MPHASIS.NS' },
      { name: 'LTIMindtree', symbol: 'LTIM.NS' },
    ]},
    { sector: 'Digital Transformation', competitors: [
      { name: 'Persistent Systems', symbol: 'PERSISTENT.NS' },
      { name: 'Coforge', symbol: 'COFORGE.NS' },
      { name: 'L&T Technology Services', symbol: 'LTTS.NS' },
    ]},
  ],
  'INFY.NS': [
    { sector: 'IT Services', competitors: [
      { name: 'TCS', symbol: 'TCS.NS' },
      { name: 'Wipro', symbol: 'WIPRO.NS' },
      { name: 'HCL Technologies', symbol: 'HCLTECH.NS' },
    ]},
    { sector: 'Consulting & Digital', competitors: [
      { name: 'Accenture', symbol: 'ACN' },
      { name: 'Cognizant', symbol: 'CTSH' },
      { name: 'Tech Mahindra', symbol: 'TECHM.NS' },
    ]},
    { sector: 'Cloud & SaaS', competitors: [
      { name: 'LTIMindtree', symbol: 'LTIM.NS' },
      { name: 'Persistent Systems', symbol: 'PERSISTENT.NS' },
      { name: 'Mphasis', symbol: 'MPHASIS.NS' },
    ]},
    { sector: 'Business Process Management', competitors: [
      { name: 'Wipro', symbol: 'WIPRO.NS' },
      { name: 'Coforge', symbol: 'COFORGE.NS' },
      { name: 'Firstsource Solutions', symbol: 'FSL.NS' },
    ]},
  ],
  'HDFCBANK.NS': [
    { sector: 'Retail Banking', competitors: [
      { name: 'ICICI Bank', symbol: 'ICICIBANK.NS' },
      { name: 'Kotak Mahindra Bank', symbol: 'KOTAKBANK.NS' },
      { name: 'Axis Bank', symbol: 'AXISBANK.NS' },
    ]},
    { sector: 'Corporate Banking', competitors: [
      { name: 'State Bank of India', symbol: 'SBIN.NS' },
      { name: 'ICICI Bank', symbol: 'ICICIBANK.NS' },
      { name: 'Bank of Baroda', symbol: 'BANKBARODA.NS' },
    ]},
    { sector: 'Treasury & Markets', competitors: [
      { name: 'ICICI Bank', symbol: 'ICICIBANK.NS' },
      { name: 'State Bank of India', symbol: 'SBIN.NS' },
      { name: 'Axis Bank', symbol: 'AXISBANK.NS' },
    ]},
    { sector: 'Digital Banking', competitors: [
      { name: 'Kotak Mahindra Bank', symbol: 'KOTAKBANK.NS' },
      { name: 'ICICI Bank', symbol: 'ICICIBANK.NS' },
      { name: 'IndusInd Bank', symbol: 'INDUSINDBK.NS' },
    ]},
  ],
  'ICICIBANK.NS': [
    { sector: 'Retail Banking', competitors: [
      { name: 'HDFC Bank', symbol: 'HDFCBANK.NS' },
      { name: 'Kotak Mahindra Bank', symbol: 'KOTAKBANK.NS' },
      { name: 'Axis Bank', symbol: 'AXISBANK.NS' },
    ]},
    { sector: 'Corporate Banking', competitors: [
      { name: 'State Bank of India', symbol: 'SBIN.NS' },
      { name: 'HDFC Bank', symbol: 'HDFCBANK.NS' },
      { name: 'Bank of Baroda', symbol: 'BANKBARODA.NS' },
    ]},
    { sector: 'Insurance & Wealth', competitors: [
      { name: 'SBI Life Insurance', symbol: 'SBILIFE.NS' },
      { name: 'HDFC Life Insurance', symbol: 'HDFCLIFE.NS' },
      { name: 'Bajaj Finance', symbol: 'BAJFINANCE.NS' },
    ]},
  ],
  'HINDUNILVR.NS': [
    { sector: 'FMCG - Personal Care', competitors: [
      { name: 'Godrej Consumer Products', symbol: 'GODREJCP.NS' },
      { name: 'Dabur India', symbol: 'DABUR.NS' },
      { name: 'Marico', symbol: 'MARICO.NS' },
    ]},
    { sector: 'FMCG - Food & Beverages', competitors: [
      { name: 'Nestle India', symbol: 'NESTLEIND.NS' },
      { name: 'Britannia', symbol: 'BRITANNIA.NS' },
      { name: 'ITC', symbol: 'ITC.NS' },
    ]},
    { sector: 'FMCG - Home Care', competitors: [
      { name: 'Procter & Gamble Hygiene', symbol: 'PGHH.NS' },
      { name: 'Godrej Consumer Products', symbol: 'GODREJCP.NS' },
      { name: 'Jyothy Labs', symbol: 'JYOTHYLAB.NS' },
    ]},
  ],
  'ITC.NS': [
    { sector: 'FMCG', competitors: [
      { name: 'Hindustan Unilever', symbol: 'HINDUNILVR.NS' },
      { name: 'Nestle India', symbol: 'NESTLEIND.NS' },
      { name: 'Britannia', symbol: 'BRITANNIA.NS' },
    ]},
    { sector: 'Cigarettes & Tobacco', competitors: [
      { name: 'Godfrey Phillips', symbol: 'GODFRYPHLP.NS' },
      { name: 'VST Industries', symbol: 'VSTIND.NS' },
      { name: 'Philip Morris', symbol: 'PM' },
    ]},
    { sector: 'Hotels & Tourism', competitors: [
      { name: 'Indian Hotels', symbol: 'INDHOTEL.NS' },
      { name: 'EIH (Oberoi)', symbol: 'EIHOTEL.NS' },
      { name: 'Lemon Tree Hotels', symbol: 'LEMONTREE.NS' },
    ]},
    { sector: 'Paperboards & Packaging', competitors: [
      { name: 'West Coast Paper', symbol: 'WESTLIFE.NS' },
      { name: 'JK Paper', symbol: 'JKPAPER.NS' },
      { name: 'Tamil Nadu Newsprint', symbol: 'TNPL.NS' },
    ]},
  ],
  'BHARTIARTL.NS': [
    { sector: 'Telecommunications', competitors: [
      { name: 'Reliance Jio (Reliance)', symbol: 'RELIANCE.NS' },
      { name: 'Vodafone Idea', symbol: 'IDEA.NS' },
      { name: 'BSNL (unlisted)', symbol: 'TATACOMM.NS' },
    ]},
    { sector: 'Digital & OTT Services', competitors: [
      { name: 'Reliance', symbol: 'RELIANCE.NS' },
      { name: 'Tata Play', symbol: 'TATACOMM.NS' },
      { name: 'Zee Entertainment', symbol: 'ZEEL.NS' },
    ]},
    { sector: 'Enterprise & B2B', competitors: [
      { name: 'Tata Communications', symbol: 'TATACOMM.NS' },
      { name: 'Reliance', symbol: 'RELIANCE.NS' },
      { name: 'Sterlite Technologies', symbol: 'STLTECH.NS' },
    ]},
  ],
  'WIPRO.NS': [
    { sector: 'IT Services', competitors: [
      { name: 'TCS', symbol: 'TCS.NS' },
      { name: 'Infosys', symbol: 'INFY.NS' },
      { name: 'HCL Technologies', symbol: 'HCLTECH.NS' },
    ]},
    { sector: 'Cloud & Digital', competitors: [
      { name: 'Tech Mahindra', symbol: 'TECHM.NS' },
      { name: 'LTIMindtree', symbol: 'LTIM.NS' },
      { name: 'Mphasis', symbol: 'MPHASIS.NS' },
    ]},
    { sector: 'Consulting', competitors: [
      { name: 'Accenture', symbol: 'ACN' },
      { name: 'Cognizant', symbol: 'CTSH' },
      { name: 'Capgemini', symbol: 'CGEMY' },
    ]},
  ],
  'SBIN.NS': [
    { sector: 'Retail Banking', competitors: [
      { name: 'HDFC Bank', symbol: 'HDFCBANK.NS' },
      { name: 'ICICI Bank', symbol: 'ICICIBANK.NS' },
      { name: 'Punjab National Bank', symbol: 'PNB.NS' },
    ]},
    { sector: 'Corporate Banking', competitors: [
      { name: 'Bank of Baroda', symbol: 'BANKBARODA.NS' },
      { name: 'Canara Bank', symbol: 'CANBK.NS' },
      { name: 'Union Bank of India', symbol: 'UNIONBANK.NS' },
    ]},
    { sector: 'Insurance & Financial Services', competitors: [
      { name: 'HDFC Life Insurance', symbol: 'HDFCLIFE.NS' },
      { name: 'ICICI Prudential Life', symbol: 'ICICIPRULI.NS' },
      { name: 'LIC Housing Finance', symbol: 'LICHSGFIN.NS' },
    ]},
  ],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = COMPETITORS_CACHE.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached competitors for:', symbol);
      return NextResponse.json(cached.data);
    }

    // Step 1: Fetch Wikipedia description
    let wikipediaData: { summary?: string; fullText?: string } = {};
    try {
      const wikiResponse = await fetch(
        `${request.nextUrl.origin}/api/wikipedia?query=${encodeURIComponent(symbol)}`,
        { signal: AbortSignal.timeout(10000) }
      );

      const wikiResult = await wikiResponse.json();

      // Handle new response format with success/data structure
      if (wikiResult.success && wikiResult.data) {
        wikipediaData = wikiResult.data;
      } else if (wikiResult.summary) {
        // Backwards compatibility with old format
        wikipediaData = wikiResult;
      } else {
        // No data available - we can still try classification with just the symbol
        console.log('No Wikipedia data for:', symbol);
      }
    } catch (error) {
      console.error('Wikipedia API error:', error);
      // Continue with empty description - Gemini can still try to classify
    }

    // Step 1.5: If Wikipedia description is thin, enrich from yfinance
    let description = wikipediaData.summary || wikipediaData.fullText?.substring(0, 500) || '';
    if (description.length < 100) {
      try {
        const quoteRes = await fetch(
          `${request.nextUrl.origin}/api/stocks/quote?symbol=${encodeURIComponent(symbol)}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (quoteRes.ok) {
          const quoteData = await quoteRes.json();
          const yfinanceDesc = quoteData.description || quoteData.longBusinessSummary || '';
          if (yfinanceDesc) {
            description = description
              ? `${description} ${yfinanceDesc}`
              : yfinanceDesc;
          }
        }
      } catch (error) {
        console.error('yfinance description enrichment error:', error);
      }
    }

    // Step 2: Classify sectors using Gemini AI
    let sectors: any[] = [];
    try {
      const classifyResponse = await fetch(
        `${request.nextUrl.origin}/api/gemini/classify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: symbol,
            description: description || `${symbol} company`
          }),
          signal: AbortSignal.timeout(15000)
        }
      );

      if (!classifyResponse.ok) {
        throw new Error('Gemini classification failed');
      }

      const classificationData = await classifyResponse.json();
      sectors = classificationData.sectors || [];
    } catch (error) {
      console.error('Gemini classification error:', error);
      // Use fallback competitors if available
      const fallback = FALLBACK_COMPETITORS[symbol.toUpperCase()];
      if (fallback) {
        console.log('Using fallback competitors for:', symbol);
        // Fallback already uses {name, symbol} format
        sectors = fallback.map(f => ({
          name: f.sector,
          competitors: f.competitors  // Already in correct format
        }));
      } else {
        // Return informative response when no fallback available
        return NextResponse.json({
          peerCompetitors: [],
          topCompetitors: [],
          message: 'Competitor analysis temporarily unavailable',
        });
      }
    }

    // Step 3: Collect all competitor symbols and fetch quotes IN PARALLEL
    // Handle both new format {name, symbol} and legacy format (string)
    const allCompetitorSymbols: { symbol: string; name: string; sectorName: string }[] = [];
    for (const sector of sectors) {
      for (const competitor of sector.competitors || []) {
        // Handle both object format and string format (for backward compatibility)
        if (typeof competitor === 'object' && competitor.symbol) {
          allCompetitorSymbols.push({
            symbol: competitor.symbol,
            name: competitor.name || competitor.symbol,
            sectorName: sector.name
          });
        } else if (typeof competitor === 'string') {
          // Legacy format - symbol only
          allCompetitorSymbols.push({
            symbol: competitor,
            name: competitor,
            sectorName: sector.name
          });
        }
      }
    }

    // Deduplicate by symbol - same competitor can appear in multiple sectors
    const seenSymbols = new Set<string>();
    const uniqueCompetitorSymbols = allCompetitorSymbols.filter(({ symbol }) => {
      const upperSymbol = symbol.toUpperCase();
      if (seenSymbols.has(upperSymbol)) return false;
      seenSymbols.add(upperSymbol);
      return true;
    });

    // Fetch all quotes in parallel (MAJOR PERFORMANCE FIX)
    const quotePromises = uniqueCompetitorSymbols.map(async ({ symbol: competitorSymbol, name: competitorName, sectorName }) => {
      try {
        const quoteRes = await fetch(
          `${request.nextUrl.origin}/api/stocks/quote?symbol=${encodeURIComponent(competitorSymbol)}`,
          { signal: AbortSignal.timeout(5000) }
        );

        if (!quoteRes.ok) {
          // Return partial competitor instead of dropping it
          return {
            sectorName,
            competitor: {
              name: competitorName,
              symbol: competitorSymbol,
              price: 0,
              change: 0,
              changePercent: 0,
              marketCap: 0,
              quoteFailed: true,
            }
          };
        }

        const quoteData = await quoteRes.json();

        if (quoteData.symbol && quoteData.price) {
          return {
            sectorName,
            competitor: {
              // Use name from Gemini/fallback if quote doesn't have one
              name: quoteData.name || competitorName,
              symbol: quoteData.symbol,
              price: quoteData.price,
              change: quoteData.change,
              changePercent: quoteData.changePercent,
              marketCap: quoteData.marketCap || 0,
              logo: quoteData.logo,
            }
          };
        }
        // Quote returned but missing essential data — return partial
        return {
          sectorName,
          competitor: {
            name: competitorName,
            symbol: competitorSymbol,
            price: 0,
            change: 0,
            changePercent: 0,
            marketCap: 0,
            quoteFailed: true,
          }
        };
      } catch (error) {
        console.error(`Failed to fetch competitor ${competitorSymbol}:`, error);
        // Return partial competitor instead of null
        return {
          sectorName,
          competitor: {
            name: competitorName,
            symbol: competitorSymbol,
            price: 0,
            change: 0,
            changePercent: 0,
            marketCap: 0,
            quoteFailed: true,
          }
        };
      }
    });

    const quoteResults = await Promise.all(quotePromises);

    // Group results by sector
    const sectorMap = new Map<string, any[]>();
    const allCompetitors: any[] = [];

    for (const result of quoteResults) {
      allCompetitors.push(result.competitor);
      if (!sectorMap.has(result.sectorName)) {
        sectorMap.set(result.sectorName, []);
      }
      sectorMap.get(result.sectorName)!.push(result.competitor);
    }

    const peerCompetitors = Array.from(sectorMap.entries()).map(([sectorName, competitors]) => ({
      sectorName,
      competitors: competitors
        .sort((a: any, b: any) => (b.marketCap || 0) - (a.marketCap || 0))
        .slice(0, 3),
    }));

    // Step 4: Get top 3 competitors by market cap (prefer those with real quotes)
    // Deduplicate allCompetitors by symbol as a safety net
    const seenTopSymbols = new Set<string>();
    const uniqueAllCompetitors = allCompetitors.filter((c: any) => {
      const sym = c.symbol?.toUpperCase();
      if (!sym || seenTopSymbols.has(sym)) return false;
      seenTopSymbols.add(sym);
      return true;
    });

    const topCompetitors = uniqueAllCompetitors
      .sort((a: any, b: any) => {
        // Prioritize competitors with successful quotes
        if (a.quoteFailed && !b.quoteFailed) return 1;
        if (!a.quoteFailed && b.quoteFailed) return -1;
        return (b.marketCap || 0) - (a.marketCap || 0);
      })
      .slice(0, 3);

    // Step 5: Fetch chart data for top 3 competitors IN PARALLEL
    const chartPromises = topCompetitors.map(async (competitor) => {
      try {
        const chartRes = await fetch(
          `${request.nextUrl.origin}/api/stocks/historical?symbol=${competitor.symbol}&range=1M`,
          { signal: AbortSignal.timeout(5000) }
        );

        if (chartRes.ok) {
          const chartData = await chartRes.json();
          return { symbol: competitor.symbol, chartData };
        }
      } catch (error) {
        console.error(`Failed to fetch chart for ${competitor.symbol}:`, error);
      }
      return { symbol: competitor.symbol, chartData: [] };
    });

    const chartResults = await Promise.all(chartPromises);

    // Attach chart data to competitors
    for (const result of chartResults) {
      const competitor = topCompetitors.find(c => c.symbol === result.symbol);
      if (competitor) {
        competitor.chartData = result.chartData;
      }
    }

    const result = {
      peerCompetitors,
      topCompetitors,
    };

    // Cache the result
    COMPETITORS_CACHE.set(symbol, {
      data: result,
      timestamp: Date.now(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Competitors API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitors' },
      { status: 500 }
    );
  }
}
