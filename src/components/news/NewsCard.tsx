'use client';

import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { SENTIMENT_BADGE } from '@/lib/sentiment';
import type { NewsArticle } from '@/types/news';

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
    : null;
  const sentimentStyle = article.sentiment
    ? SENTIMENT_BADGE[article.sentiment as keyof typeof SENTIMENT_BADGE]
    : null;

  const hasUrl = !!article.url;
  const Tag = hasUrl ? motion.a : motion.div;
  const linkProps = hasUrl
    ? { href: article.url, target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Tag
      {...linkProps}
      className="glass-card p-4 hover:bg-white/15 dark:hover:bg-black/25 transition-all block"
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex gap-4">
        {article.urlToImage && (
          <div className="flex-shrink-0">
            <img
              src={article.urlToImage}
              alt={article.title}
              className="w-24 h-24 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-brand-500 uppercase">
              {article.source.name}
            </span>
            {timeAgo && (
              <>
                <span className="text-xs text-gray-500 dark:text-gray-400">·</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</span>
              </>
            )}
            {sentimentStyle && (
              <>
                <span className="text-xs text-gray-500 dark:text-gray-400">·</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 ${sentimentStyle.bg} ${sentimentStyle.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sentimentStyle.dot}`} />
                  {sentimentStyle.label}
                </span>
              </>
            )}
          </div>

          <h3 className="font-semibold text-base mb-2 line-clamp-2 hover:text-brand-500 transition-colors">
            {article.title}
          </h3>

          {article.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {article.description}
            </p>
          )}
        </div>
      </div>
    </Tag>
  );
}
