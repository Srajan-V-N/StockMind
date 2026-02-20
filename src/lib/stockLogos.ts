// Map common stock symbols to their domains
const SYMBOL_TO_DOMAIN: Record<string, string> = {
  // Tech Giants
  'AAPL': 'apple.com',
  'MSFT': 'microsoft.com',
  'GOOGL': 'google.com',
  'GOOG': 'google.com',
  'AMZN': 'amazon.com',
  'META': 'meta.com',
  'TSLA': 'tesla.com',
  'NVDA': 'nvidia.com',
  'AMD': 'amd.com',
  'INTC': 'intel.com',
  'ORCL': 'oracle.com',
  'CSCO': 'cisco.com',
  'CRM': 'salesforce.com',
  'ADBE': 'adobe.com',
  'NFLX': 'netflix.com',
  'PYPL': 'paypal.com',
  'UBER': 'uber.com',
  'LYFT': 'lyft.com',
  'SNAP': 'snap.com',
  'SPOT': 'spotify.com',
  'SQ': 'squareup.com',
  'SHOP': 'shopify.com',

  // Finance
  'JPM': 'jpmorganchase.com',
  'BAC': 'bankofamerica.com',
  'WFC': 'wellsfargo.com',
  'GS': 'goldmansachs.com',
  'MS': 'morganstanley.com',
  'C': 'citigroup.com',
  'BLK': 'blackrock.com',
  'SCHW': 'schwab.com',
  'AXP': 'americanexpress.com',
  'V': 'visa.com',
  'MA': 'mastercard.com',

  // Consumer Goods
  'KO': 'coca-cola.com',
  'PEP': 'pepsico.com',
  'WMT': 'walmart.com',
  'TGT': 'target.com',
  'COST': 'costco.com',
  'HD': 'homedepot.com',
  'LOW': 'lowes.com',
  'MCD': 'mcdonalds.com',
  'SBUX': 'starbucks.com',
  'NKE': 'nike.com',
  'DIS': 'disney.com',

  // Healthcare & Pharma
  'JNJ': 'jnj.com',
  'UNH': 'unitedhealthgroup.com',
  'PFE': 'pfizer.com',
  'ABBV': 'abbvie.com',
  'TMO': 'thermofisher.com',
  'ABT': 'abbott.com',
  'MRK': 'merck.com',
  'LLY': 'lilly.com',
  'CVS': 'cvs.com',
  'CI': 'cigna.com',

  // Energy
  'XOM': 'exxonmobil.com',
  'CVX': 'chevron.com',
  'COP': 'conocophillips.com',
  'SLB': 'slb.com',

  // Industrials
  'BA': 'boeing.com',
  'CAT': 'caterpillar.com',
  'GE': 'ge.com',
  'HON': 'honeywell.com',
  'UPS': 'ups.com',
  'FDX': 'fedex.com',

  // Telecom
  'T': 'att.com',
  'VZ': 'verizon.com',
  'TMUS': 't-mobile.com',

  // Automotive
  'F': 'ford.com',
  'GM': 'gm.com',

  // Retail
  'EBAY': 'ebay.com',
  'ETSY': 'etsy.com',

  // Media
  'CMCSA': 'comcast.com',
  'PARA': 'paramount.com',

  // Real Estate
  'AMT': 'americantower.com',

  // Materials
  'LIN': 'linde.com',

  // Software/Cloud
  'NOW': 'servicenow.com',
  'SNOW': 'snowflake.com',
  'DDOG': 'datadoghq.com',
  'ZM': 'zoom.us',
  'DOCU': 'docusign.com',

  // European Companies
  'SAP': 'sap.com',
  'ASML': 'asml.com',
  'LVMH.PA': 'lvmh.com',
  'NVO': 'novonordisk.com',
  'SHEL': 'shell.com',
  'HSBC': 'hsbc.com',
  'BP': 'bp.com',
  'UL': 'unilever.com',
  'RIO': 'riotinto.com',
  'BHP': 'bhp.com',
  'GSK': 'gsk.com',
  'AZN': 'astrazeneca.com',
  'DEO': 'diageo.com',
  'BTI': 'bat.com',
  'RELX': 'relx.com',
  'VOD': 'vodafone.com',
  'NG': 'natgrid.com',
  'SAN': 'santander.com',
  'BBVA': 'bbva.com',
  'SAF': 'safran-group.com',

  // Asian Companies
  'TSM': 'tsmc.com',
  'BABA': 'alibaba.com',
  'BIDU': 'baidu.com',
  'JD': 'jd.com',
  'SONY': 'sony.com',
  'TME': 'tencentmusic.com',
  'NIO': 'nio.com',
  'XPEV': 'xiaopeng.com',
  'LI': 'lixiang.com',
  'PDD': 'pinduoduo.com',
  'NTES': 'netease.com',
  'BILI': 'bilibili.com',
  'SE': 'sea.com',
  'GRAB': 'grab.com',
  'KB': 'kbfg.com',
  'HMC': 'honda.com',
  'TM': 'toyota.com',
  'MUFG': 'mufg.jp',
  'SMFG': 'smfg.co.jp',

  // Canadian Companies
  'RY': 'rbc.com',
  'TD': 'td.com',
  'BNS': 'scotiabank.com',
  'BMO': 'bmo.com',
  'CNQ': 'cnq.com',
  'SU': 'suncor.com',
  'ENB': 'enbridge.com',
  'TRP': 'tcenergy.com',
  'CNR': 'cn.ca',
  'CP': 'cpr.ca',

  // Australian Companies
  'CBA': 'commbank.com.au',
  'WBC': 'westpac.com.au',
  'NAB': 'nab.com.au',
  'ANZ': 'anz.com',
  'WES': 'wesfarmers.com.au',
  'WOW': 'woolworthsgroup.com.au',
  'BXB': 'brambles.com',
  'FMG': 'fmgl.com.au',

  // Indian Stocks (NSE - National Stock Exchange)
  'RELIANCE.NS': 'ril.com',
  'TCS.NS': 'tcs.com',
  'HDFCBANK.NS': 'hdfcbank.com',
  'INFY.NS': 'infosys.com',
  'HINDUNILVR.NS': 'hul.co.in',
  'ICICIBANK.NS': 'icicibank.com',
  'SBIN.NS': 'sbi.co.in',
  'BHARTIARTL.NS': 'airtel.in',
  'ITC.NS': 'itcportal.com',
  'KOTAKBANK.NS': 'kotak.com',
  'LT.NS': 'larsentoubro.com',
  'AXISBANK.NS': 'axisbank.com',
  'ASIANPAINT.NS': 'asianpaints.com',
  'MARUTI.NS': 'marutisuzuki.com',
  'BAJFINANCE.NS': 'bajajfinserv.in',
  'TITAN.NS': 'titan.co.in',
  'WIPRO.NS': 'wipro.com',
  'TECHM.NS': 'techmahindra.com',
  'HCLTECH.NS': 'hcltech.com',
  'ULTRACEMCO.NS': 'ultratechcement.com',
  'NESTLEIND.NS': 'nestle.in',
  'ADANIPORTS.NS': 'adaniports.com',
  'SUNPHARMA.NS': 'sunpharma.com',
  'TATAMOTORS.NS': 'tatamotors.com',
  'TATASTEEL.NS': 'tatasteel.com',
  'POWERGRID.NS': 'powergridindia.com',
  'M&M.NS': 'mahindra.com',
  'NTPC.NS': 'ntpc.co.in',
  'ONGC.NS': 'ongcindia.com',
  'INDUSINDBK.NS': 'indusind.com',

  // BSE format (Bombay Stock Exchange)
  'RELIANCE.BO': 'ril.com',
  'TCS.BO': 'tcs.com',
  'HDFCBANK.BO': 'hdfcbank.com',
  'INFY.BO': 'infosys.com',
  'ICICIBANK.BO': 'icicibank.com',
  'SBIN.BO': 'sbi.co.in',
  'BHARTIARTL.BO': 'airtel.in',
  'ITC.BO': 'itcportal.com',
  'KOTAKBANK.BO': 'kotak.com',
  'LT.BO': 'larsentoubro.com',

  // Market Indices
  '^GSPC': 'spglobal.com',
  '^DJI': 'dowjones.com',
  '^IXIC': 'nasdaq.com',
  '^RUT': 'ftserussell.com',
  '^VIX': 'cboe.com',
  '^NSEI': 'nseindia.com',
  '^BSESN': 'bseindia.com',
  '^NSEBANK': 'nseindia.com',
  '^FTSE': 'ftserussell.com',
  '^GDAXI': 'deutsche-boerse.com',
  '^FCHI': 'euronext.com',
  '^IBEX': 'bolsasymercados.es',
  '^STOXX50E': 'stoxx.com',
};

/**
 * Get company logo URL from stock symbol
 * Falls back to derived domain if not in mapping
 */
export function getStockLogoUrl(symbol: string, companyName?: string): string | null {
  // Check hardcoded mapping first
  const domain = SYMBOL_TO_DOMAIN[symbol.toUpperCase()];
  if (domain) {
    // Use Google S2 favicon service (more reliable than Clearbit)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }

  // Attempt to derive domain from company name
  if (companyName) {
    const derivedDomain = deriveCompanyDomain(companyName);
    if (derivedDomain) {
      return `https://www.google.com/s2/favicons?domain=${derivedDomain}&sz=128`;
    }
  }

  // No logo available
  return null;
}

/**
 * Derive company domain from name (best effort)
 * Examples:
 *  - "Apple Inc." -> "apple.com"
 *  - "Microsoft Corporation" -> "microsoft.com"
 *  - "Tesla Motors" -> "teslamotors.com"
 *  - "Reliance Industries" -> "ril.com"
 */
function deriveCompanyDomain(companyName: string): string | null {
  // Special cases for Indian companies
  const indianMappings: Record<string, string> = {
    'reliance': 'ril.com',
    'tata consultancy': 'tcs.com',
    'infosys': 'infosys.com',
    'hdfc bank': 'hdfcbank.com',
    'icici bank': 'icicibank.com',
    'state bank of india': 'sbi.co.in',
    'bharti airtel': 'airtel.in',
    'larsen & toubro': 'larsentoubro.com',
    'larsen and toubro': 'larsentoubro.com',
    'asian paints': 'asianpaints.com',
    'maruti suzuki': 'marutisuzuki.com',
    'hindustan unilever': 'hul.co.in',
    'kotak mahindra': 'kotak.com',
    'axis bank': 'axisbank.com',
    'bajaj finance': 'bajajfinserv.in',
    'titan': 'titan.co.in',
    'wipro': 'wipro.com',
    'tech mahindra': 'techmahindra.com',
    'hcl tech': 'hcltech.com',
    'ultratech cement': 'ultratechcement.com',
    'tata motors': 'tatamotors.com',
    'tata steel': 'tatasteel.com',
    'mahindra': 'mahindra.com',
    'ntpc': 'ntpc.co.in',
    'ongc': 'ongcindia.com',
    'indusind bank': 'indusind.com',
  };

  const lowerName = companyName.toLowerCase();
  for (const [key, domain] of Object.entries(indianMappings)) {
    if (lowerName.includes(key)) {
      return domain;
    }
  }

  // Remove common suffixes
  let cleanName = companyName
    .replace(/\s+(Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|LLC|LP|Co\.?|Company|Group|Holdings|International|Plc)$/i, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (cleanName.length > 2) {
    return `${cleanName}.com`;
  }

  return null;
}

/**
 * Check if logo URL is valid (use for caching in future)
 */
export async function isLogoUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
