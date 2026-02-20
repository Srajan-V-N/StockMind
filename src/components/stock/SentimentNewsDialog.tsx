'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { NewsCard } from '@/components/news/NewsCard';
import { SENTIMENT_BADGE, type SentimentType } from '@/lib/sentiment';
import type { ClassifiedArticle, NewsArticle } from '@/types/news';

interface SentimentNewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articles: ClassifiedArticle[];
  symbol: string;
  mood: string;
}

export function SentimentNewsDialog({
  open,
  onOpenChange,
  articles,
  symbol,
  mood,
}: SentimentNewsDialogProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = articles;

    // Apply search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
      );
    }

    // Apply tab filter
    if (activeTab !== 'all') {
      result = result.filter((a) => a.sentiment === activeTab);
    }

    return result;
  }, [articles, activeTab, searchQuery]);

  // Counts based on search-filtered articles (so tab counts reflect search)
  const searchFiltered = useMemo(() => {
    if (!searchQuery) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q)
    );
  }, [articles, searchQuery]);

  const counts = {
    positive: searchFiltered.filter((a) => a.sentiment === 'positive').length,
    neutral: searchFiltered.filter((a) => a.sentiment === 'neutral').length,
    negative: searchFiltered.filter((a) => a.sentiment === 'negative').length,
    mixed: searchFiltered.filter((a) => a.sentiment === 'mixed').length,
  };

  const tabs = [
    { value: 'all', label: `All (${searchFiltered.length})` },
    { value: 'positive', label: `Positive (${counts.positive})` },
    { value: 'neutral', label: `Neutral (${counts.neutral})` },
    { value: 'negative', label: `Negative (${counts.negative})` },
    ...(counts.mixed > 0
      ? [{ value: 'mixed', label: `Mixed (${counts.mixed})` }]
      : []),
  ];

  const moodBadge = SENTIMENT_BADGE[mood as SentimentType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>News Sentiment — {symbol}</DialogTitle>
          <DialogDescription>
            {articles.length} article{articles.length !== 1 ? 's' : ''} analyzed
            {' '}&middot; Overall mood:{' '}
            <span className={moodBadge?.text || 'text-gray-400'}>
              {moodBadge?.label || mood}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList className={`grid w-full ${tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-3">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? 'No articles match your search'
                  : `No ${activeTab === 'all' ? '' : activeTab + ' '}articles found`}
              </div>
            ) : (
              <motion.div
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } },
                }}
              >
                {filtered.map((article, idx) => {
                  const newsArticle: NewsArticle = {
                    source: { id: null, name: article.source },
                    title: article.title,
                    description: article.description || '',
                    url: article.url || '',
                    urlToImage: article.urlToImage,
                    publishedAt: article.publishedAt || '',
                    sentiment: article.sentiment,
                  };
                  return (
                    <motion.div
                      key={idx}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      <NewsCard article={newsArticle} />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </Tabs>

        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-white/10">
          Sentiment classification is for educational purposes only
        </p>
      </DialogContent>
    </Dialog>
  );
}
