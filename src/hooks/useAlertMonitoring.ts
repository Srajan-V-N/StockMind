'use client';

import { useEffect, useRef } from 'react';
import { useTrading } from '@/contexts/TradingContext';
import { useNotification } from '@/contexts/NotificationContext';

/**
 * Hook to monitor price alerts for portfolio holdings
 * Checks alerts every 30 seconds and shows toast notifications when triggered
 */
export function useAlertMonitoring() {
  const { portfolio } = useTrading();
  const { alerts, checkAlerts, updateAlert, showToast } = useNotification();

  // Track triggered alerts to avoid duplicate notifications
  const triggeredAlerts = useRef(new Set<string>());

  // Store in refs so the effect doesn't re-trigger when these change
  const holdingsRef = useRef(portfolio.holdings);
  holdingsRef.current = portfolio.holdings;

  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  const checkAlertsRef = useRef(checkAlerts);
  checkAlertsRef.current = checkAlerts;

  const updateAlertRef = useRef(updateAlert);
  updateAlertRef.current = updateAlert;

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // Stable primitives — only change when the actual set of symbols or active alerts changes
  const symbolsKey = portfolio.holdings
    .map(h => `${h.symbol}:${h.type}`)
    .sort()
    .join(',');

  const activeAlertsKey = alerts
    .filter(a => a.active)
    .map(a => a.id)
    .sort()
    .join(',');

  useEffect(() => {
    if (!activeAlertsKey || !symbolsKey) return;

    const monitorAlerts = async () => {
      const holdings = holdingsRef.current;

      for (const holding of holdings) {
        try {
          const endpoint = holding.type === 'stock'
            ? `/api/stocks/quote?symbol=${holding.symbol}`
            : `/api/crypto/price?id=${holding.symbol}`;

          const res = await fetch(endpoint);

          if (!res.ok) {
            console.error(`Failed to fetch price for ${holding.symbol}`);
            continue;
          }

          const data = await res.json();
          const currentPrice = data.price;

          if (!currentPrice) continue;

          const triggered = checkAlertsRef.current(holding.symbol, currentPrice);

          for (const alert of triggered) {
            if (triggeredAlerts.current.has(alert.id)) continue;

            triggeredAlerts.current.add(alert.id);
            updateAlertRef.current(alert.id, { active: false });

            const conditionText = alert.condition === 'above' ? 'above' : 'below';
            const message = `${alert.symbol} is now ${conditionText} ${alert.targetPrice}! Current price: ${currentPrice.toFixed(2)}`;

            showToastRef.current(message, 'warning', 7000);
          }
        } catch (error) {
          console.error(`Failed to monitor alerts for ${holding.symbol}:`, error);
        }
      }
    };

    monitorAlerts();
    const interval = setInterval(monitorAlerts, 30000);

    return () => clearInterval(interval);
  }, [symbolsKey, activeAlertsKey]);
}
