'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CompanyAboutProps {
  description?: string;
}

export function CompanyAbout({ description }: CompanyAboutProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) {
    return null;
  }

  const shouldTruncate = description.length > 300;
  const displayText = shouldTruncate && !isExpanded
    ? description.substring(0, 300) + '...'
    : description;

  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {displayText}
        </p>
        {shouldTruncate && (
          <Button
            variant="link"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 px-0"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
