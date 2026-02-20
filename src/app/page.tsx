export const dynamic = 'force-dynamic';

import { Navbar } from '@/components/layout/Navbar';
import { TopMarketsNav } from '@/components/layout/TopMarketsNav';
import { MarketSnapshot } from '@/components/layout/MarketSnapshot';
import { Footer } from '@/components/layout/Footer';
import { HeroSearch } from '@/components/home/HeroSearch';
import { InterestedIn } from '@/components/home/InterestedIn';
import { MarketTrends } from '@/components/home/MarketTrends';
import { DiscoverMore } from '@/components/home/DiscoverMore';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <TopMarketsNav />

      {/* Market Snapshot with visual separator */}
      <section className="border-b border-white/10 dark:border-neutral-800">
        <MarketSnapshot />
      </section>

      <main className="flex-1 bg-gradient-page animate-page-enter">
        {/* Hero Section - Prominent spacing */}
        <section className="py-16 px-6">
          <div className="container mx-auto max-w-7xl">
            <HeroSearch />
          </div>
        </section>

        {/* Content Sections - Better rhythm and spacing */}
        <div className="space-y-20 pb-20">
          <section className="px-6">
            <div className="container mx-auto max-w-7xl">
              <InterestedIn />
            </div>
          </section>

          <section className="px-6">
            <div className="container mx-auto max-w-7xl">
              <MarketTrends />
            </div>
          </section>

          <section className="px-6">
            <div className="container mx-auto max-w-7xl">
              <DiscoverMore />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
