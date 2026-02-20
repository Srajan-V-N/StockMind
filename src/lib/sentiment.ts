export const SENTIMENT_BADGE = {
  positive: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400', label: 'Positive' },
  neutral:  { bg: 'bg-gray-500/10',  text: 'text-gray-400',  dot: 'bg-gray-400',  label: 'Neutral' },
  negative: { bg: 'bg-red-500/10',   text: 'text-red-400',   dot: 'bg-red-400',   label: 'Negative' },
  mixed:    { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400', label: 'Mixed' },
} as const;

export type SentimentType = keyof typeof SENTIMENT_BADGE;
