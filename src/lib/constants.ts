// API Endpoints
export const API_ENDPOINTS = {
  stocks: {
    search: '/api/stocks/search',
    quote: '/api/stocks/quote',
    historical: '/api/stocks/historical',
    summary: '/api/stocks/summary',
  },
  crypto: {
    search: '/api/crypto/search',
    price: '/api/crypto/price',
    historical: '/api/crypto/historical',
  },
  news: '/api/news',
  wikipedia: '/api/wikipedia',
  gemini: {
    classify: '/api/gemini/classify',
    chat: '/api/gemini/chat',
  },
  competitors: '/api/competitors',
  fx: '/api/fx',
  db: {
    portfolio: '/api/db/portfolio',
    trade: '/api/db/portfolio',
    resetPortfolio: '/api/db/portfolio/reset',
    alerts: '/api/db/alerts',
    watchlist: '/api/db/watchlist',
    checklists: '/api/db/checklists',
    checklistStats: '/api/db/checklists/stats',
  },
  mentor: {
    analyze: '/api/mentor/analyze',
    dismiss: '/api/mentor/dismiss',
    history: '/api/mentor/history',
  },
  evaluation: {
    scores: '/api/evaluation/scores',
    compute: '/api/evaluation/compute',
    badges: '/api/evaluation/badges',
    reportLatest: '/api/evaluation/report/latest',
    reportHistory: '/api/evaluation/report/history',
    reportGenerate: '/api/evaluation/report/generate',
    profile: '/api/evaluation/profile',
    behaviorSummary: '/api/evaluation/behavior-summary',
  },
  challenges: {
    active: '/api/challenges',
    refresh: '/api/challenges/refresh',
    history: '/api/challenges/history',
  },
  journal: {
    list: '/api/journal',
    create: '/api/journal',
    bySymbol: (symbol: string) => `/api/journal/symbol/${encodeURIComponent(symbol)}`,
    byTransaction: (id: string) => `/api/journal/transaction/${encodeURIComponent(id)}`,
  },
  sentiment: {
    get: '/api/sentiment',
    batch: '/api/sentiment/batch',
    history: '/api/sentiment/history',
    divergence: '/api/sentiment/divergence',
  },
};

// Markets
export const MARKETS = [
  { value: 'global', label: 'Markets' },
  { value: 'us', label: 'US' },
  { value: 'europe', label: 'Europe' },
  { value: 'india', label: 'India' },
  { value: 'currencies', label: 'Currencies' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'futures', label: 'Futures' },
] as const;

// Time Ranges
export const TIME_RANGES = ['1D', '5D', '1M', '6M', '1Y', 'MAX'] as const;

// News Sources
export const NEWS_DOMAINS = [
  'reuters.com',
  'bloomberg.com',
  'cnbc.com',
  'wsj.com',
  'economictimes.indiatimes.com',
];

// Financial Keywords
export const FINANCIAL_KEYWORDS = [
  'stock',
  'market',
  'trading',
  'investment',
  'shares',
  'economy',
  'finance',
  'cryptocurrency',
  'earnings',
  'revenue',
  'profit',
  'loss',
  'dividend',
  'ipo',
  'nasdaq',
  'dow jones',
  's&p 500',
];

// LocalStorage Keys
export const STORAGE_KEYS = {
  theme: 'stockmind-theme',
  market: 'stockmind-market',
  watchlist: 'stockmind-watchlist',
  portfolio: 'stockmind-portfolio',
  alerts: 'stockmind-alerts',
  preferences: 'stockmind-preferences',
  chat: 'stockmind-chat',
  guidedMode: 'stockmind-guided-mode',
  learningMode: 'stockmind-learning-mode',
  mentorState: 'stockmind-mentor-state',
};

// Default Values
export const DEFAULTS = {
  portfolio: {
    startingBalance: 100000,
    baseCurrency: 'USD',
  },
  theme: 'dark' as 'light' | 'dark',
  market: 'global' as const,
};

// Chart Colors
export const CHART_COLORS = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#F44336', // Red
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#E91E63', // Pink
];

// Currencies
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];
