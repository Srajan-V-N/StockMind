export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author?: string;
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  content?: string;
  sentiment?: string;
}

export interface ClassifiedArticle {
  title: string;
  sentiment: string;
  source: string;
  url?: string;
  description?: string;
  publishedAt?: string;
  urlToImage?: string;
}

export type NewsCategory = 'top' | 'local' | 'world';

export interface NewsFilter {
  category: NewsCategory;
  market?: string;
  query?: string;
}
