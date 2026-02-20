import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { MarketProvider } from '@/contexts/MarketContext';
import { WatchlistProvider } from '@/contexts/WatchlistContext';
import { TradingProvider } from '@/contexts/TradingContext';
import { MentorProvider } from '@/contexts/MentorContext';
import { EvaluationProvider } from '@/contexts/EvaluationContext';
import { ChallengesProvider } from '@/contexts/ChallengesContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ChatbotProvider } from '@/contexts/ChatbotContext';
import { GuidedTradingProvider } from '@/contexts/GuidedTradingContext';
import { LearningModeProvider } from '@/contexts/LearningModeContext';
import { ChatbotOverlay } from '@/components/chatbot/ChatbotOverlay';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StockMind - Global Stock & Crypto Intelligence',
  description: 'Explore stocks, crypto, markets, news, and learn investing with virtual trading. A Google Finance-level financial intelligence platform.',
  keywords: ['stocks', 'crypto', 'trading', 'finance', 'investment', 'market data', 'virtual trading'],
  authors: [{ name: 'StockMind' }],
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2196F3' },
    { media: '(prefers-color-scheme: dark)', color: '#0d47a1' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <CurrencyProvider>
            <MarketProvider>
              <WatchlistProvider>
                <TradingProvider>
                  <MentorProvider>
                    <EvaluationProvider>
                      <ChallengesProvider>
                        <NotificationProvider>
                          <ChatbotProvider>
                            <GuidedTradingProvider>
                              <LearningModeProvider>
                                <div className="flex flex-col min-h-screen">
                                  {children}
                                </div>
                                <ChatbotOverlay />
                              </LearningModeProvider>
                            </GuidedTradingProvider>
                          </ChatbotProvider>
                        </NotificationProvider>
                      </ChallengesProvider>
                    </EvaluationProvider>
                  </MentorProvider>
                </TradingProvider>
              </WatchlistProvider>
            </MarketProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
