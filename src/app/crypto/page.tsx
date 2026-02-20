'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { TopMarketsNav } from '@/components/layout/TopMarketsNav';
import { MarketSnapshot } from '@/components/layout/MarketSnapshot';
import { Footer } from '@/components/layout/Footer';
import { SearchBar } from '@/components/shared/SearchBar';
import { AssetCard } from '@/components/shared/AssetCard';
import { useRouter } from 'next/navigation';

interface Crypto {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume: number;
  marketCap: number;
}

export default function CryptoPage() {
  const router = useRouter();
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    fetchTopCryptos();
  }, []);

  const fetchTopCryptos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch top 30 cryptocurrencies using the markets endpoint (single API call)
      const response = await fetch('/api/crypto/markets?per_page=30');

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Transform the data to match our Crypto interface
      const formattedCryptos: Crypto[] = data.map((crypto: any) => ({
        id: crypto.id,
        symbol: crypto.symbol?.toUpperCase() || '',
        name: crypto.name || '',
        image: crypto.image,
        price: crypto.current_price || 0,
        change24h: crypto.price_change_24h || 0,
        changePercent24h: crypto.price_change_percentage_24h || 0,
        volume: crypto.total_volume || 0,
        marketCap: crypto.market_cap || 0,
      }));

      setCryptos(formattedCryptos);
    } catch (error) {
      console.error('Error fetching cryptocurrencies:', error);
      setError('Unable to load cryptocurrency data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCrypto = (id: string, name: string, type: 'stock' | 'crypto') => {
    if (type === 'stock') {
      router.push(`/stocks/${id}`);
    } else {
      router.push(`/crypto/${id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <TopMarketsNav />

      <section className="border-b border-white/10 dark:border-neutral-800">
        <MarketSnapshot />
      </section>

      <main className="flex-1 bg-gradient-page">
        <div className="container mx-auto px-6 py-16 max-w-7xl">
          {/* Search overlay - outside hero so it doesn't cover hero text */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                onClick={() => setIsFocused(false)}
              />
            )}
          </AnimatePresence>

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`text-center mb-16 relative ${isFocused ? 'z-40' : ''}`}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-400 dark:to-brand-600 bg-clip-text text-transparent">
              Cryptocurrency Market
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-10 font-medium">
              Explore top cryptocurrencies and their market performance
            </p>

            <div className={`relative max-w-2xl mx-auto ${isFocused ? 'z-40' : 'z-10'}`}>
              <SearchBar
                onSelectAsset={handleSelectCrypto}
                placeholder="Search cryptocurrencies..."
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              />
            </div>
          </motion.div>

          {/* Crypto Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight mb-8">
              Top Cryptocurrencies by Market Cap
            </h2>

            {error ? (
              <div className="max-w-2xl mx-auto">
                <div className="glass-card p-8 text-center">
                  <div className="text-red-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                    Failed to Load Data
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                    {error}
                  </p>
                  <button
                    onClick={fetchTopCryptos}
                    className="glass-button px-6 py-3 rounded-xl font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-brand-200 dark:border-brand-900 border-t-brand-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                    Loading cryptocurrencies...
                  </p>
                </div>
              </div>
            ) : cryptos.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                  No cryptocurrencies found.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-fade-in">
                {cryptos.map((crypto) => (
                  <AssetCard
                    key={crypto.id}
                    symbol={crypto.id}
                    name={crypto.name}
                    type="crypto"
                    price={crypto.price}
                    change={crypto.change24h}
                    changePercent={crypto.changePercent24h}
                    volume={crypto.volume}
                    marketCap={crypto.marketCap}
                    image={crypto.image}
                    onClick={() => handleSelectCrypto(crypto.id, crypto.name, 'crypto')}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
