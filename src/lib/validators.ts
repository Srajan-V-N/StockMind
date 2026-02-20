// Validation utilities

export function isValidSymbol(symbol: string): boolean {
  return /^[A-Z0-9._-]+$/i.test(symbol);
}

export function isValidQuantity(quantity: number): boolean {
  return quantity > 0 && Number.isFinite(quantity);
}

export function isValidPrice(price: number): boolean {
  return price > 0 && Number.isFinite(price);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitizeSearchQuery(query: string): string {
  return query.trim().replace(/[<>]/g, '');
}

export function isFinancialNews(title: string, description: string): boolean {
  const financialKeywords = [
    'stock', 'market', 'trading', 'investment', 'shares',
    'economy', 'finance', 'cryptocurrency', 'earnings',
    'revenue', 'profit', 'loss', 'dividend', 'ipo',
    'nasdaq', 'dow jones', 's&p 500', 'nifty', 'sensex',
    'company', 'business', 'ceo', 'quarterly', 'analyst',
    'growth', 'sector', 'valuation', 'crypto', 'bitcoin',
    'ethereum', 'blockchain',
  ];

  const text = `${title} ${description}`.toLowerCase();
  return financialKeywords.some(keyword => text.includes(keyword));
}
