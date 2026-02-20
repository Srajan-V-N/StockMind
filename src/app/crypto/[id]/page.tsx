'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { TopMarketsNav } from '@/components/layout/TopMarketsNav';
import { MarketSnapshot } from '@/components/layout/MarketSnapshot';
import { Footer } from '@/components/layout/Footer';
import { CryptoHeader } from '@/components/crypto/CryptoHeader';
import { CryptoMetrics } from '@/components/crypto/CryptoMetrics';
import { CryptoAbout } from '@/components/crypto/CryptoAbout';
import { CryptoComparison } from '@/components/crypto/CryptoComparison';
import { UnifiedChart } from '@/components/charts/UnifiedChart';
import { SearchBar } from '@/components/shared/SearchBar';
import { Button } from '@/components/ui/button';
import { SentimentPanel } from '@/components/stock/SentimentPanel';
import { DivergenceBadge } from '@/components/stock/DivergenceBadge';
import { useCryptoData } from '@/hooks/useCryptoData';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { TimeRange } from '@/types/chart';

export default function CryptoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [showComparison, setShowComparison] = useState(false);

  const { data: crypto, loading: cryptoLoading, error: cryptoError } = useCryptoData(id);
  const { data: chartData, loading: chartLoading } = useHistoricalData(id, 'crypto', timeRange);

  if (cryptoLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <TopMarketsNav />
        <section className="border-b border-white/10 dark:border-neutral-800">
          <MarketSnapshot />
        </section>
        <div className="container mx-auto px-6 py-4">
          <SearchBar type="all" placeholder="Search stocks, crypto..." />
        </div>
        <main className="flex-1 bg-gradient-page">
          <div className="container mx-auto px-6 py-16">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-brand-200 dark:border-brand-900 border-t-brand-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-neutral-600 dark:text-neutral-400 font-medium">Loading cryptocurrency data...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (cryptoError || !crypto) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <TopMarketsNav />
        <section className="border-b border-white/10 dark:border-neutral-800">
          <MarketSnapshot />
        </section>
        <div className="container mx-auto px-6 py-4">
          <SearchBar type="all" placeholder="Search stocks, crypto..." />
        </div>
        <main className="flex-1 bg-gradient-page">
          <div className="container mx-auto px-6 py-16">
            <div className="max-w-2xl mx-auto glass-card-premium p-10 text-center rounded-2xl">
              <svg
                className="w-16 h-16 mx-auto mb-6 text-neutral-400 dark:text-neutral-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">
                Cryptocurrency Not Found
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mb-2 text-lg">
                The cryptocurrency with ID <span className="font-semibold text-neutral-900 dark:text-white">"{id}"</span> could not be found.
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-8">
                This coin may have been delisted or the ID is invalid on CoinGecko.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => router.push('/crypto')}
                  className="px-6 py-2"
                >
                  Back to Crypto List
                </Button>
                <Button
                  onClick={() => router.back()}
                  variant="glass"
                  className="px-6 py-2"
                >
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <TopMarketsNav />
      <section className="border-b border-white/10 dark:border-neutral-800">
        <MarketSnapshot />
      </section>
      <div className="container mx-auto px-6 py-4">
        <SearchBar type="all" placeholder="Search stocks, crypto..." />
      </div>
      <main className="flex-1 bg-gradient-page">
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Header */}
            <CryptoHeader crypto={crypto} />

            {/* Chart Section */}
            <div className="glass-card-premium p-8 rounded-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">Price Chart</h2>
                <Button
                  variant={showComparison ? 'default' : 'glass'}
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? 'Hide Comparison' : 'Compare'}
                </Button>
              </div>

              {!showComparison ? (
                <UnifiedChart
                  data={chartData}
                  type="crypto"
                  height={400}
                  timeRange={timeRange}
                  showTimeToggle={true}
                  onTimeRangeChange={(range) => setTimeRange(range as TimeRange)}
                  currency="USD"
                  loading={chartLoading}
                />
              ) : (
                <CryptoComparison
                  baseCrypto={{
                    id: crypto.id,
                    name: crypto.name,
                    symbol: crypto.symbol,
                    data: chartData,
                  }}
                />
              )}
            </div>

            {/* Price-Sentiment Divergence */}
            <DivergenceBadge symbol={crypto.symbol?.toUpperCase() || id} name={crypto.name} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - About */}
              <div className="lg:col-span-2">
                <CryptoAbout description={crypto.description} name={crypto.name} />
              </div>

              {/* Right Column - Metrics + Sentiment */}
              <div className="lg:col-span-1 space-y-6">
                <CryptoMetrics crypto={crypto} />
                <SentimentPanel symbol={crypto.symbol?.toUpperCase() || id} name={crypto.name} />
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
