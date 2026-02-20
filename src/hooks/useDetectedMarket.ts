'use client';

import { useState, useEffect } from 'react';

const LOCALE_TO_MARKET: Record<string, string> = {
  'en-US': 'us',
  'en-CA': 'us',
  'en-IN': 'india',
  'hi': 'india',
  'hi-IN': 'india',
  'en-GB': 'uk',
  'de': 'europe',
  'de-DE': 'europe',
  'fr': 'europe',
  'fr-FR': 'europe',
  'es': 'europe',
  'es-ES': 'europe',
  'it': 'europe',
  'it-IT': 'europe',
  'ja': 'asia',
  'ja-JP': 'asia',
  'ko': 'asia',
  'ko-KR': 'asia',
  'zh': 'asia',
  'zh-CN': 'asia',
  'zh-TW': 'asia',
};

export function useDetectedMarket(): string {
  const [market, setMarket] = useState('us');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const locale = navigator.language;
      const detected =
        LOCALE_TO_MARKET[locale] ||
        LOCALE_TO_MARKET[locale.split('-')[0]] ||
        'us';
      setMarket(detected);
    }
  }, []);

  return market;
}
