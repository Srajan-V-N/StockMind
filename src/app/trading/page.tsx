'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { TopMarketsNav } from '@/components/layout/TopMarketsNav';
import { MarketSnapshot } from '@/components/layout/MarketSnapshot';
import { Footer } from '@/components/layout/Footer';
import { Portfolio } from '@/components/trading/Portfolio';
import { Holdings } from '@/components/trading/Holdings';
import { TradeModal } from '@/components/trading/TradeModal';
import { TransactionHistory } from '@/components/trading/TransactionHistory';
import { PerformanceChart } from '@/components/trading/PerformanceChart';
import { MentorPanel } from '@/components/trading/MentorPanel';
import { EvaluationDashboard } from '@/components/trading/EvaluationDashboard';
import { ChallengesPanel } from '@/components/trading/ChallengesPanel';
import { TraderProfile } from '@/components/trading/TraderProfile';
import { MonthlyReportCard } from '@/components/trading/MonthlyReportCard';
import { Button } from '@/components/ui/button';
import { useRealTimePrices } from '@/hooks/useRealTimePrices';
import { useAlertMonitoring } from '@/hooks/useAlertMonitoring';
import { GuidedModeToggle } from '@/components/trading/GuidedModeToggle';
import { GuidedOverlay } from '@/components/trading/GuidedOverlay';
import { LearningOverlay } from '@/components/trading/LearningOverlay';
import { useLearningMode } from '@/contexts/LearningModeContext';
import { useEvaluation } from '@/contexts/EvaluationContext';

const TABS = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'mentor', label: 'Mentor & Scores' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'profile', label: 'Profile & Reports' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function TradingPage() {
  // Enable real-time price updates for holdings
  useRealTimePrices();

  // Enable alert monitoring with toast notifications
  useAlertMonitoring();

  const { interactionLockedIds } = useLearningMode();
  const { latestReport } = useEvaluation();
  const isLocked = (id: string) => interactionLockedIds.includes(id);

  const [activeTab, setActiveTab] = useState<TabId>('portfolio');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>();
  const [selectedType, setSelectedType] = useState<'stock' | 'crypto' | undefined>();
  const [selectedAction, setSelectedAction] = useState<'buy' | 'sell'>('buy');

  const handleTrade = (
    symbol?: string,
    type?: 'stock' | 'crypto',
    action: 'buy' | 'sell' = 'buy'
  ) => {
    setSelectedSymbol(symbol);
    setSelectedType(type);
    setSelectedAction(action);
    setIsTradeModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsTradeModalOpen(false);
    setSelectedSymbol(undefined);
    setSelectedType(undefined);
    setSelectedAction('buy');
  };

  return (
    <>
      <Navbar />
      <TopMarketsNav />
      <MarketSnapshot />
      <main className="flex-1 bg-gradient-page min-h-screen">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              Virtual Trading
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              Practice trading with virtual money - track your portfolio and performance
            </p>
            <GuidedModeToggle />
            <Button
              id="guided-start-trading"
              onClick={() => handleTrade()}
              size="lg"
              className={isLocked('guided-start-trading') ? 'pointer-events-none opacity-50' : ''}
              aria-disabled={isLocked('guided-start-trading') || undefined}
            >
              Start Trading
            </Button>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex gap-1 mb-8 p-1 glass-card rounded-xl overflow-x-auto"
          >
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'portfolio' && (
              <div className="space-y-6">
                <Portfolio />
                <PerformanceChart />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Holdings
                    onTrade={(symbol, type, action) => handleTrade(symbol, type, action)}
                  />
                  <TransactionHistory />
                </div>
              </div>
            )}

            {activeTab === 'mentor' && (
              <div className="space-y-6">
                <MentorPanel />
                <EvaluationDashboard />
              </div>
            )}

            {activeTab === 'challenges' && (
              <ChallengesPanel />
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <TraderProfile />
                {latestReport && (
                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="font-semibold text-lg mb-4">Latest Report</h3>
                    <MonthlyReportCard report={latestReport} />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />

      {/* Trade Modal */}
      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={handleCloseModal}
        initialSymbol={selectedSymbol}
        initialType={selectedType}
        initialAction={selectedAction}
      />

      <GuidedOverlay />
      <LearningOverlay />
    </>
  );
}
