'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { TopMarketsNav } from '@/components/layout/TopMarketsNav';
import { MarketSnapshot } from '@/components/layout/MarketSnapshot';
import { Footer } from '@/components/layout/Footer';
import { SearchBar } from '@/components/shared/SearchBar';
import { NewsFilters } from '@/components/news/NewsFilters';
import { NewsList } from '@/components/news/NewsList';
import { useDetectedMarket } from '@/hooks/useDetectedMarket';
import { API_ENDPOINTS } from '@/lib/constants';
import type { NewsArticle } from '@/types/news';

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState('top');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLabel, setSearchLabel] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const detectedMarket = useDetectedMarket();
  const [market, setMarket] = useState('us');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-detect market when switching to local tab
  useEffect(() => {
    if (selectedCategory === 'local') {
      setMarket(detectedMarket);
    }
  }, [selectedCategory, detectedMarket]);

  useEffect(() => {
    fetchNews(selectedCategory, debouncedQuery);
  }, [selectedCategory, debouncedQuery, market]);

  const fetchNews = async (category: string, query: string = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category });
      if (query) params.set('query', query);
      if (category === 'local') params.set('market', market);
      const response = await fetch(`/api/news?${params}`);
      const data = await response.json();

      if (!data.error) {
        const raw = data.articles || [];
        // Classify sentiment for fetched articles via batch
        const classified = await classifyArticles(raw);
        setArticles(classified);
      } else {
        setArticles([]);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const classifyArticles = async (rawArticles: NewsArticle[]): Promise<NewsArticle[]> => {
    try {
      // Use the sentiment batch endpoint with article titles as "symbols"
      const symbols = [{ symbol: 'MARKET_NEWS', name: 'Financial Markets' }];
      const resp = await fetch(API_ENDPOINTS.sentiment.batch, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });
      const data = await resp.json();
      const classified = data.sentiments?.MARKET_NEWS?.classified_articles || [];

      // Map sentiment to articles by title match
      const sentimentMap = new Map<string, string>();
      for (const ca of classified) {
        sentimentMap.set(ca.title?.toLowerCase()?.slice(0, 50), ca.sentiment);
      }

      return rawArticles.map((article) => {
        const key = article.title?.toLowerCase()?.slice(0, 50);
        return { ...article, sentiment: sentimentMap.get(key) };
      });
    } catch {
      // If classification fails, return articles without sentiment
      return rawArticles;
    }
  };

  // Apply sentiment filter
  const filteredArticles = sentimentFilter === 'all'
    ? articles
    : articles.filter((a) => a.sentiment === sentimentFilter);

  return (
    <>
      <Navbar />
      <TopMarketsNav />
      <MarketSnapshot />
      <main className="flex-1 bg-gradient-page min-h-screen">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              Financial News
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Stay updated with the latest market news and insights
            </p>
          </motion.div>

          {/* Search Backdrop Overlay */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                onClick={() => setIsFocused(false)}
              />
            )}
          </AnimatePresence>

          {/* Search */}
          <div className={`flex justify-center mb-8 relative ${isFocused ? 'z-40' : 'z-10'}`}>
            <SearchBar
              placeholder="Search news by company, crypto, or topic..."
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onSelectAsset={(symbol, name) => {
                setSearchQuery(name);
                setSearchLabel(name);
                setIsFocused(false);
              }}
            />
          </div>

          {/* Active Search Filter Chip */}
          {searchLabel && (
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium border border-brand-200 dark:border-brand-800">
                Showing news for: {searchLabel}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchLabel('');
                  }}
                  className="ml-1 hover:text-brand-900 dark:hover:text-brand-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            </div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <NewsFilters
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sentimentFilter={sentimentFilter}
              onSentimentFilterChange={setSentimentFilter}
              market={market}
              onMarketChange={setMarket}
              showMarketSelector={selectedCategory === 'local'}
            />
          </motion.div>

          {/* News List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <NewsList articles={filteredArticles} loading={loading} />
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
