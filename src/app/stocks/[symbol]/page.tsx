'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { TopMarketsNav } from '@/components/layout/TopMarketsNav';
import { MarketSnapshot } from '@/components/layout/MarketSnapshot';
import { Footer } from '@/components/layout/Footer';
import { StockHeader } from '@/components/stock/StockHeader';
import { StockMetrics } from '@/components/stock/StockMetrics';
import { CompanyAbout } from '@/components/stock/CompanyAbout';
import { PeerCompetitors } from '@/components/stock/PeerCompetitors';
import { TopCompetitors } from '@/components/stock/TopCompetitors';
import { ComparisonMode } from '@/components/stock/ComparisonMode';
import { UnifiedChart } from '@/components/charts/UnifiedChart';
import { SearchBar } from '@/components/shared/SearchBar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SentimentPanel } from '@/components/stock/SentimentPanel';
import { DivergenceBadge } from '@/components/stock/DivergenceBadge';
import { useStockData } from '@/hooks/useStockData';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { TimeRange } from '@/types/chart';
import { Competitor, SectorCompetitors } from '@/types/stock';

export default function StockDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [showComparison, setShowComparison] = useState(false);
  const [competitors, setCompetitors] = useState<{
    top: (Competitor & { chartData?: any[] })[];
    sectors: SectorCompetitors[];
  } | null>(null);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);

  const { data: quote, loading: quoteLoading, error: quoteError } = useStockData(symbol);
  const { data: chartData, loading: chartLoading } = useHistoricalData(symbol, 'stock', timeRange);

  useEffect(() => {
    if (symbol) {
      // Don't await - let it run in parallel with other data fetches
      fetchCompetitors();
    }
  }, [symbol]);

  const fetchCompetitors = async () => {
    setLoadingCompetitors(true);
    try {
      const response = await fetch(`/api/competitors?symbol=${symbol}`);
      const data = await response.json();

      if (!data.error) {
        setCompetitors({
          top: data.topCompetitors || [],
          sectors: data.peerCompetitors || [],
        });
      }
    } catch (error) {
      console.error('Error fetching competitors:', error);
    } finally {
      setLoadingCompetitors(false);
    }
  };

  if (quoteLoading) {
    return (
      <>
        <Navbar />
        <TopMarketsNav />
        <MarketSnapshot />
        <div className="container mx-auto px-6 py-4">
          <SearchBar type="all" placeholder="Search stocks, crypto..." />
        </div>
        <main className="flex-1 bg-gradient-page min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading stock data...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (quoteError || !quote) {
    return (
      <>
        <Navbar />
        <TopMarketsNav />
        <MarketSnapshot />
        <div className="container mx-auto px-6 py-4">
          <SearchBar type="all" placeholder="Search stocks, crypto..." />
        </div>
        <main className="flex-1 bg-gradient-page min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="glass-card p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Stock Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Unable to find stock data for symbol: {symbol}
              </p>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <TopMarketsNav />
      <MarketSnapshot />
      <div className="container mx-auto px-6 py-4">
        <SearchBar type="all" placeholder="Search stocks, crypto..." />
      </div>
      <main className="flex-1 bg-gradient-page min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Header */}
            <StockHeader quote={quote} />

            {/* Chart Section */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Price Chart</h2>
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
                  type="stock"
                  height={400}
                  timeRange={timeRange}
                  showTimeToggle={true}
                  onTimeRangeChange={(range) => setTimeRange(range as TimeRange)}
                  showPreviousClose={true}
                  previousClose={quote.previousClose}
                  currency={quote.currency}
                  loading={chartLoading}
                />
              ) : (
                <ComparisonMode
                  baseAsset={{
                    symbol: quote.symbol,
                    name: quote.name,
                    type: 'stock',
                    data: (chartData as any).data || chartData,
                  }}
                />
              )}
            </div>

            {/* Price-Sentiment Divergence */}
            <DivergenceBadge symbol={symbol} name={quote.name} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                <CompanyAbout description={quote.description} />

                {/* Competitors Tabs */}
                <Tabs defaultValue="top" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="top">Top Competitors</TabsTrigger>
                    <TabsTrigger value="peers">Peer Competitors</TabsTrigger>
                  </TabsList>
                  <TabsContent value="top" className="mt-6">
                    {loadingCompetitors ? (
                      <div className="glass-card p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Loading competitors...
                        </p>
                      </div>
                    ) : (
                      <TopCompetitors competitors={competitors?.top || []} />
                    )}
                  </TabsContent>
                  <TabsContent value="peers" className="mt-6">
                    {loadingCompetitors ? (
                      <div className="glass-card p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Loading competitors...
                        </p>
                      </div>
                    ) : (
                      <PeerCompetitors sectors={competitors?.sectors || []} />
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Column - Metrics + Sentiment */}
              <div className="lg:col-span-1 space-y-6">
                <StockMetrics quote={quote} />
                <SentimentPanel symbol={symbol} name={quote.name} />
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
