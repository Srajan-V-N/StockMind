'use client';

import { motion } from 'framer-motion';
import { NewsCard } from './NewsCard';
import type { NewsArticle } from '@/types/news';

interface NewsListProps {
  articles: NewsArticle[];
  loading?: boolean;
}

export function NewsList({ articles, loading = false }: NewsListProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading news articles...</p>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No news articles found for this category.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {articles.map((article, index) => (
        <motion.div key={`${article.url}-${index}`} variants={item}>
          <NewsCard article={article} />
        </motion.div>
      ))}
    </motion.div>
  );
}
