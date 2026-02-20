'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CHECKLIST_ITEMS, ChecklistState } from '@/types/mentor';

interface TradeChecklistProps {
  symbol: string;
  type: 'stock' | 'crypto';
  action: 'buy' | 'sell';
  onConfirm: (checklist: ChecklistState) => void;
  onCancel: () => void;
}

export function TradeChecklist({ symbol, type, action, onConfirm, onCancel }: TradeChecklistProps) {
  const [items, setItems] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST_ITEMS.map(item => [item.id, false]))
  );

  const checkedCount = Object.values(items).filter(Boolean).length;
  const allChecked = checkedCount === CHECKLIST_ITEMS.length;

  const toggleItem = (id: string) => {
    setItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirm = () => {
    onConfirm({ items, skipped: false });
  };

  const handleSkip = () => {
    onConfirm({ items, skipped: true });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pre-Trade Checklist</div>
        <div className="font-semibold text-lg">
          {action === 'buy' ? 'Buying' : 'Selling'} {symbol}
          <span className="ml-2 text-xs uppercase bg-brand-500/20 text-brand-500 px-2 py-0.5 rounded">
            {type}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => (
          <label
            key={item.id}
            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
              items[item.id]
                ? 'bg-green-500/10 border border-green-500/30'
                : 'glass-card hover:bg-white/5'
            }`}
            onClick={() => toggleItem(item.id)}
          >
            <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              items[item.id]
                ? 'bg-green-500 border-green-500'
                : 'border-gray-400 dark:border-gray-600'
            }`}>
              {items[item.id] && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <div className="font-medium text-sm">{item.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {checkedCount}/{CHECKLIST_ITEMS.length} items checked
      </div>

      <div className="flex gap-2">
        <Button variant="glass" onClick={onCancel} className="flex-1">
          Back
        </Button>
        <Button
          variant="glass"
          onClick={handleSkip}
          className="flex-1 text-yellow-500 hover:text-yellow-400"
        >
          Skip & Trade
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!allChecked}
          className="flex-1"
        >
          Confirm Trade
        </Button>
      </div>
    </div>
  );
}
