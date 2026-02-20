'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MARKET_OPTIONS = [
  { value: 'us', label: 'US' },
  { value: 'india', label: 'India' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
  { value: 'uk', label: 'UK' },
];

interface NewsFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sentimentFilter?: string;
  onSentimentFilterChange?: (filter: string) => void;
  market?: string;
  onMarketChange?: (market: string) => void;
  showMarketSelector?: boolean;
}

export function NewsFilters({
  selectedCategory,
  onCategoryChange,
  sentimentFilter,
  onSentimentFilterChange,
  market,
  onMarketChange,
  showMarketSelector,
}: NewsFiltersProps) {
  const categories = [
    { value: 'top', label: 'Top Stories', icon: '🌟' },
    { value: 'local', label: 'Local Market', icon: '📍' },
    { value: 'world', label: 'World Markets', icon: '🌍' },
  ];

  const sentimentOptions = [
    { value: 'all', label: 'All' },
    { value: 'positive', label: 'Positive', dot: 'bg-green-400' },
    { value: 'neutral', label: 'Neutral', dot: 'bg-gray-400' },
    { value: 'negative', label: 'Negative', dot: 'bg-red-400' },
  ];

  return (
    <div className="mb-8 space-y-4">
      <Tabs value={selectedCategory} onValueChange={onCategoryChange}>
        <TabsList className="grid w-full grid-cols-3 gap-2">
          {categories.map((category) => (
            <TabsTrigger
              key={category.value}
              value={category.value}
              className="gap-2"
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {showMarketSelector && onMarketChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Market:</span>
          {MARKET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onMarketChange(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                market === opt.value
                  ? 'bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30'
                  : 'bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {onSentimentFilterChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Sentiment:</span>
          {sentimentOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSentimentFilterChange(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                sentimentFilter === opt.value
                  ? 'bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30'
                  : 'bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-white/10'
              }`}
            >
              {opt.dot && <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
