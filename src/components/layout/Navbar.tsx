'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useChatbot } from '@/contexts/ChatbotContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import Image from "next/image";

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/crypto', label: 'Crypto' },
  { href: '/news', label: 'News' },
  { href: '/trading', label: 'Trading' },
  { href: '/notifications', label: 'Notifications' },
];

export const Navbar = memo(function Navbar() {
  const pathname = usePathname();
  const { toggleChatbot } = useChatbot();
  const { alerts } = useNotificationContext();
  const triggeredCount = useMemo(() => alerts.filter(a => a.triggered).length, [alerts]);

  return (
    <nav className="glass-navbar sticky top-0 z-40">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shadow-black/20">
            <Image
              src="/favicon.svg"
              alt="StockMind Logo"
              width={40}
              height={40}
              priority
            />
          </div>

            <span className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-400 dark:to-brand-600 bg-clip-text text-transparent hidden sm:block">
              StockMind
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              const isNotifications = link.href === '/notifications';
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
                    isActive
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-white/10 dark:hover:bg-neutral-800/50'
                  )}
                >
                  {link.label}
                  {isNotifications && triggeredCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center px-1 text-[11px] font-bold text-white bg-red-500 rounded-full shadow-lg shadow-red-500/40">
                      {triggeredCount > 99 ? '99+' : triggeredCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="glass"
              size="icon"
              onClick={toggleChatbot}
              className="rounded-full w-10 h-10 glass-button-premium hover:scale-105 transition-transform"
              aria-label="Open chatbot"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex gap-1.5 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            const isNotifications = link.href === '/notifications';
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200',
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                    : 'glass-button-premium text-neutral-700 dark:text-neutral-300'
                )}
              >
                {link.label}
                {isNotifications && triggeredCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm">
                    {triggeredCount > 99 ? '99+' : triggeredCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
});
