'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CryptoAboutProps {
  description?: string;
  name: string;
}

export function CryptoAbout({ description, name }: CryptoAboutProps) {
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
        <CardTitle>About {name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: displayText }}
        />
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
