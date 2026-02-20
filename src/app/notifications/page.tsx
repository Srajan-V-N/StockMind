'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { TopMarketsNav } from '@/components/layout/TopMarketsNav';
import { MarketSnapshot } from '@/components/layout/MarketSnapshot';
import { Footer } from '@/components/layout/Footer';
import { AlertForm } from '@/components/notifications/AlertForm';
import { AlertsList } from '@/components/notifications/AlertsList';
import { BudgetExplorer } from '@/components/notifications/BudgetExplorer';
import { useAlertMonitoring } from '@/hooks/useAlertMonitoring';

export default function NotificationsPage() {
  // Enable alert monitoring with toast notifications
  useAlertMonitoring();

  // Tab state
  const [activeTab, setActiveTab] = useState<'alerts' | 'explore'>('alerts');

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
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              Alerts & Exploration
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Set price alerts and explore assets within your budget
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex rounded-lg glass-card p-1">
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'alerts'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-brand-500'
                }`}
              >
                Price Alerts
              </button>
              <button
                onClick={() => setActiveTab('explore')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'explore'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-brand-500'
                }`}
              >
                Budget Explorer
              </button>
            </div>
          </motion.div>

          {/* Tab Content */}
          {activeTab === 'alerts' ? (
            <>
              {/* Alerts Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Left Column - Alert Form */}
                <div className="lg:col-span-1">
                  <AlertForm />
                </div>

                {/* Right Column - Alerts List */}
                <div className="lg:col-span-2">
                  <AlertsList />
                </div>
              </motion.div>

              {/* Info Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-12 glass-card p-6 rounded-xl"
              >
                <h3 className="font-semibold text-lg mb-3">How Price Alerts Work</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-500 font-bold">•</span>
                    <span>
                      Create alerts for any stock or cryptocurrency to monitor price movements
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-500 font-bold">•</span>
                    <span>
                      Set target prices with &quot;above&quot; or &quot;below&quot; conditions to match your strategy
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-500 font-bold">•</span>
                    <span>
                      Alerts are checked automatically and will trigger when conditions are met
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-500 font-bold">•</span>
                    <span>
                      Manage your alerts easily - delete alerts you no longer need
                    </span>
                  </li>
                </ul>
              </motion.div>
            </>
          ) : (
            /* Budget Explorer Content */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <BudgetExplorer />
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
