'use client';

import { createContext, useContext, ReactNode, useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PriceAlert, BudgetSuggestion } from '@/types/api';
import { STORAGE_KEYS, API_ENDPOINTS } from '@/lib/constants';
import { ToastContainer, ToastProps } from '@/components/ui/toast';

interface NotificationContextType {
  alerts: PriceAlert[];
  addAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'active'>) => void;
  removeAlert: (id: string) => void;
  updateAlert: (id: string, updates: Partial<PriceAlert>) => void;
  checkAlerts: (symbol: string, currentPrice: number) => PriceAlert[];
  budgetSuggestions: BudgetSuggestion[];
  setBudgetSuggestions: (suggestions: BudgetSuggestion[]) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useLocalStorage<PriceAlert[]>(
    STORAGE_KEYS.alerts,
    []
  );

  const [budgetSuggestions, setBudgetSuggestions] = useLocalStorage<BudgetSuggestion[]>(
    'stockmind-suggestions',
    []
  );

  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const hydratedRef = useRef(false);

  // Hydrate alerts from DB on mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    async function hydrateFromDB() {
      try {
        const res = await fetch(API_ENDPOINTS.db.alerts, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.alerts && Array.isArray(data.alerts)) {
          const dbAlerts: PriceAlert[] = data.alerts.map((a: any) => ({
            id: a.id,
            symbol: a.symbol,
            name: a.name,
            type: a.type,
            targetPrice: a.targetPrice,
            condition: a.condition,
            active: a.active,
            triggered: a.triggered || false,
            createdAt: new Date(a.createdAt),
          }));
          setAlerts(dbAlerts);
        }
      } catch (err) {
        console.warn('Failed to hydrate alerts from DB:', err);
      }
    }

    hydrateFromDB();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addAlert = useCallback((alertData: Omit<PriceAlert, 'id' | 'createdAt' | 'active'>) => {
    const newAlert: PriceAlert = {
      ...alertData,
      id: `${Date.now()}-${Math.random()}`,
      active: true,
      createdAt: new Date(),
    };

    setAlerts(prev => [newAlert, ...prev]);

    // Persist to DB in background
    fetch(API_ENDPOINTS.db.alerts, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: alertData.symbol,
        name: alertData.name,
        type: alertData.type,
        targetPrice: alertData.targetPrice,
        condition: alertData.condition,
      }),
    }).catch(err => console.warn('Failed to persist alert to DB:', err));
  }, [setAlerts]);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));

    // Persist to DB in background
    fetch(`${API_ENDPOINTS.db.alerts}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(err => console.warn('Failed to delete alert from DB:', err));
  }, [setAlerts]);

  const updateAlert = useCallback((id: string, updates: Partial<PriceAlert>) => {
    setAlerts(prev =>
      prev.map(alert => (alert.id === id ? { ...alert, ...updates } : alert))
    );

    // Persist to DB in background
    const dbUpdates: Record<string, any> = {};
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    if (updates.triggered !== undefined) dbUpdates.triggered = updates.triggered;
    if (updates.targetPrice !== undefined) dbUpdates.targetPrice = updates.targetPrice;
    if (updates.condition !== undefined) dbUpdates.condition = updates.condition;

    if (Object.keys(dbUpdates).length > 0) {
      fetch(`${API_ENDPOINTS.db.alerts}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbUpdates),
      }).catch(err => console.warn('Failed to update alert in DB:', err));
    }
  }, [setAlerts]);

  const checkAlerts = useCallback((symbol: string, currentPrice: number) => {
    const triggeredAlerts: PriceAlert[] = [];

    alerts.forEach(alert => {
      if (!alert.active || alert.symbol !== symbol) return;

      const triggered =
        (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
        (alert.condition === 'below' && currentPrice <= alert.targetPrice);

      if (triggered) {
        triggeredAlerts.push(alert);
      }
    });

    return triggeredAlerts;
  }, [alerts]);

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = 5000
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: ToastProps = {
      id,
      message,
      type,
      duration,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value = useMemo(() => ({
    alerts,
    addAlert,
    removeAlert,
    updateAlert,
    checkAlerts,
    budgetSuggestions,
    setBudgetSuggestions,
    showToast,
  }), [alerts, addAlert, removeAlert, updateAlert, checkAlerts, budgetSuggestions, setBudgetSuggestions, showToast]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

// Alias for consistency
export const useNotificationContext = useNotification;
