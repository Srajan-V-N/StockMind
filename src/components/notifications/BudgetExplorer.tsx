'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface ExplorationAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  marketCapRange: 'large' | 'mid' | 'small' | 'micro';
  type: 'stock' | 'crypto';
  currency: string;
  logo?: string;
}

interface ExplorationResult {
  success: boolean;
  data?: {
    budget: number;
    currency: string;
    market: string;
    totalAssets: number;
    groupedByMarketCap: Record<string, ExplorationAsset[]>;
    assets: ExplorationAsset[];
    disclaimer: string;
  };
  error?: string;
}

/**
 * Budget-Based Exploration Component
 *
 * Per Prompt.md and UX.md:
 * - Educational and exploratory feature
 * - Shows assets within user-defined budget
 * - NO ranking, NO "best" labels, NO predictions
 * - Descriptive language only
 */
export function BudgetExplorer() {
  const router = useRouter();
  const [budget, setBudget] = useState<string>('100');
  const [market, setMarket] = useState<'US' | 'India' | 'crypto'>('US');
  const [currency, setCurrency] = useState<string>('USD');
  const [result, setResult] = useState<ExplorationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExplore = useCallback(async () => {
    const budgetNum = parseFloat(budget);
    if (!budgetNum || budgetNum <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        budget: budgetNum.toString(),
        currency,
        market,
      });

      const response = await fetch(`/api/budget-explore?${params}`);
      const data: ExplorationResult = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to explore assets');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  }, [budget, currency, market]);

  const handleAssetClick = (asset: ExplorationAsset) => {
    if (asset.type === 'crypto') {
      router.push(`/crypto/${asset.symbol.toLowerCase()}`);
    } else {
      router.push(`/stocks/${asset.symbol}`);
    }
  };

  const marketCapLabels: Record<string, string> = {
    large: 'Large Cap ($10B+)',
    mid: 'Mid Cap ($2B - $10B)',
    small: 'Small Cap ($300M - $2B)',
    micro: 'Micro Cap (< $300M)',
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="glass-card p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Explore by Budget</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Discover assets trading within your budget. This is for educational exploration only.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Budget Input */}
          <div>
            <label className="block text-sm font-medium mb-1">Budget</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 rounded-lg glass-input-premium"
              min="1"
            />
          </div>

          {/* Currency Select */}
          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 rounded-lg glass-input-premium"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          {/* Market Select */}
          <div>
            <label className="block text-sm font-medium mb-1">Market</label>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg glass-input-premium"
            >
              <option value="US">US Stocks</option>
              <option value="India">Indian Stocks</option>
              <option value="crypto">Cryptocurrency</option>
            </select>
          </div>

          {/* Explore Button */}
          <div className="flex items-end">
            <button
              onClick={handleExplore}
              disabled={loading}
              className="w-full px-4 py-2 rounded-lg glass-button text-white font-medium
                bg-gradient-to-r from-brand-500 to-brand-600
                hover:from-brand-600 hover:to-brand-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200"
            >
              {loading ? 'Exploring...' : 'Explore'}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
      </div>

      {/* Results Section */}
      {result?.data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary */}
          <div className="glass-card p-4 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found <span className="font-semibold text-brand-500">{result.data.totalAssets}</span> assets
              trading at or below{' '}
              <span className="font-semibold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: result.data.currency,
                }).format(result.data.budget)}
              </span>
            </p>
          </div>

          {/* Grouped Results */}
          {['large', 'mid', 'small', 'micro'].map((cap) => {
            const assets = result.data!.groupedByMarketCap[cap];
            if (!assets || assets.length === 0) return null;

            return (
              <div key={cap} className="glass-card p-4 rounded-xl">
                <h3 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">
                  {marketCapLabels[cap]}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({assets.length} assets)
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assets.slice(0, 9).map((asset) => (
                    <motion.div
                      key={asset.symbol}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleAssetClick(asset)}
                      className="p-3 rounded-lg bg-white/50 dark:bg-neutral-800/50
                        border border-gray-200/50 dark:border-neutral-700/50
                        cursor-pointer hover:border-brand-500/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {asset.logo && (
                          <img
                            src={asset.logo}
                            alt={asset.name}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{asset.name}</p>
                          <p className="text-xs text-gray-500">{asset.symbol}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: asset.currency,
                              minimumFractionDigits: asset.price < 1 ? 4 : 2,
                            }).format(asset.price)}
                          </p>
                          <p className={`text-xs ${
                            asset.changePercent >= 0 ? 'text-success-500' : 'text-danger-500'
                          }`}>
                            {asset.changePercent >= 0 ? '+' : ''}
                            {asset.changePercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {assets.length > 9 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    +{assets.length - 9} more assets
                  </p>
                )}
              </div>
            );
          })}

          {/* Disclaimer */}
          <div className="glass-card p-4 rounded-xl border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Educational Purpose Only:</span>{' '}
              {result.data.disclaimer}
            </p>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {result?.data && result.data.totalAssets === 0 && (
        <div className="glass-card p-6 rounded-xl text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No assets found within your budget in the selected market.
            Try increasing your budget or exploring a different market.
          </p>
        </div>
      )}
    </div>
  );
}
