'use client';

import { DailyScores } from '@/types/mentor';

interface ScoreRadarChartProps {
  scores: DailyScores;
  size?: number;
}

const DIMENSIONS = [
  { key: 'risk', label: 'Risk' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'psychology', label: 'Psychology' },
  { key: 'consistency', label: 'Consistency' },
] as const;

export function ScoreRadarChart({ scores, size = 250 }: ScoreRadarChartProps) {
  const center = size / 2;
  const radius = size * 0.38;
  const angleStep = (2 * Math.PI) / 5;
  const startAngle = -Math.PI / 2; // Start from top

  const getPoint = (index: number, value: number): { x: number; y: number } => {
    const angle = startAngle + index * angleStep;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Score polygon points
  const scorePoints = DIMENSIONS.map((dim, i) => {
    const value = scores[dim.key as keyof DailyScores] as number;
    return getPoint(i, value);
  });
  const scorePath = scorePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Grid rings at 25%, 50%, 75%, 100%
  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {gridLevels.map(level => {
          const points = DIMENSIONS.map((_, i) => getPoint(i, level));
          const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
          return (
            <path
              key={level}
              d={path}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          );
        })}

        {/* Grid lines from center */}
        {DIMENSIONS.map((_, i) => {
          const p = getPoint(i, 100);
          return (
            <line
              key={i}
              x1={center} y1={center}
              x2={p.x} y2={p.y}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          );
        })}

        {/* Score polygon */}
        <path
          d={scorePath}
          fill="rgba(99, 102, 241, 0.2)"
          stroke="rgb(99, 102, 241)"
          strokeWidth={2}
        />

        {/* Score dots */}
        {scorePoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="rgb(99, 102, 241)"
          />
        ))}

        {/* Labels */}
        {DIMENSIONS.map((dim, i) => {
          const p = getPoint(i, 120);
          const value = scores[dim.key as keyof DailyScores] as number;
          return (
            <g key={dim.key}>
              <text
                x={p.x}
                y={p.y - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-current text-gray-600 dark:text-gray-400"
                fontSize={11}
                fontWeight={500}
              >
                {dim.label}
              </text>
              <text
                x={p.x}
                y={p.y + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-current text-gray-500 dark:text-gray-500"
                fontSize={10}
              >
                {typeof value === 'number' ? value.toFixed(0) : '0'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
