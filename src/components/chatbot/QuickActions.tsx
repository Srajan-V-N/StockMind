'use client';

import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const quickActions = [
    'What are the top gainers today?',
    'Show me trending cryptocurrencies',
    'Explain market trends',
    'Compare AAPL and MSFT',
  ];

  return (
    <div className="mb-4">
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Quick Actions:</p>
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="glass"
            size="sm"
            onClick={() => onAction(action)}
            className="text-xs"
          >
            {action}
          </Button>
        ))}
      </div>
    </div>
  );
}
