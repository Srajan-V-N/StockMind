'use client';

import { TimeRange } from '@/types/chart';
import { TIME_RANGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TimeRangeToggleProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeToggle({ selected, onChange }: TimeRangeToggleProps) {
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {TIME_RANGES.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium transition-all duration-200',
            selected === range
              ? 'bg-gradient-brand text-white shadow-lg'
              : 'glass-button hover:bg-white/15'
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}
