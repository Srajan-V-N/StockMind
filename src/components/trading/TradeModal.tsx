'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTradingContext } from '@/contexts/TradingContext';
import { formatCurrency } from '@/lib/formatters';
import { SearchBar } from '@/components/shared/SearchBar';
import { TradeChecklist } from './TradeChecklist';
import { DivergenceInfo } from '@/components/stock/DivergenceBadge';
import { useDivergence } from '@/hooks/useDivergence';
import { ChecklistState } from '@/types/mentor';
import { API_ENDPOINTS } from '@/lib/constants';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol?: string;
  initialType?: 'stock' | 'crypto';
  initialAction?: 'buy' | 'sell';
}

export function TradeModal({
  isOpen,
  onClose,
  initialSymbol,
  initialType,
  initialAction = 'buy',
}: TradeModalProps) {
  const { portfolio, buyAsset, sellAsset } = useTradingContext();
  const [step, setStep] = useState<'form' | 'checklist'>('form');
  // Fetch divergence data when a symbol is selected and action is buy
  const { divergence } = useDivergence(
    initialSymbol || undefined,
    undefined
  );
  const [action, setAction] = useState<'buy' | 'sell'>(initialAction);
  const [symbol, setSymbol] = useState(initialSymbol || '');
  const [type, setType] = useState<'stock' | 'crypto'>(initialType || 'stock');
  const [quantity, setQuantity] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialSymbol && initialType) {
      setSymbol(initialSymbol);
      setType(initialType);
      fetchCurrentPrice(initialSymbol, initialType);
    }
  }, [initialSymbol, initialType]);

  useEffect(() => {
    if (initialAction) {
      setAction(initialAction);
    }
  }, [initialAction]);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('form');
    }
  }, [isOpen]);

  const fetchCurrentPrice = async (sym: string, assetType: 'stock' | 'crypto') => {
    try {
      const endpoint = assetType === 'stock' ? '/api/stocks/quote' : '/api/crypto/price';
      const param = assetType === 'stock' ? `symbol=${sym}` : `id=${sym}`;

      const response = await fetch(`${endpoint}?${param}`);
      const data = await response.json();

      if (!data.error) {
        setCurrentPrice(data.price);
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };

  const handleSelectAsset = (selectedSymbol: string, name: string, selectedType: 'stock' | 'crypto') => {
    setSymbol(selectedSymbol);
    setType(selectedType);
    fetchCurrentPrice(selectedSymbol, selectedType);
  };

  const handlePreTrade = () => {
    if (!symbol || !quantity || parseFloat(quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    setStep('checklist');
  };

  const handleConfirmedTrade = async (checklistState: ChecklistState) => {
    setLoading(true);

    try {
      const qty = parseFloat(quantity);
      const price = currentPrice;

      let tradeResult: { success: boolean; message: string };

      if (action === 'buy') {
        const totalCost = qty * price;
        if (totalCost > portfolio.balance) {
          alert('Insufficient balance');
          setLoading(false);
          return;
        }

        const assetName = symbol;
        tradeResult = buyAsset({ symbol, name: assetName, type, quantity: qty, price });
      } else {
        const holding = portfolio.holdings.find(
          (h) => h.symbol === symbol && h.type === type
        );

        if (!holding || holding.quantity < qty) {
          alert('Insufficient holdings');
          setLoading(false);
          return;
        }

        tradeResult = sellAsset({ symbol, name: symbol, type, quantity: qty, price });
      }

      if (tradeResult.success) {
        // Save checklist to DB in background
        const checkedCount = Object.values(checklistState.items).filter(Boolean).length;
        fetch(API_ENDPOINTS.db.checklists, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId: `${Date.now()}-checklist`,
            symbol,
            type,
            action,
            items: checklistState.items,
            skipped: checklistState.skipped,
            completedCount: checkedCount,
          }),
        }).catch(err => console.warn('Failed to save checklist:', err));

        alert(tradeResult.message);
      } else {
        alert(tradeResult.message);
      }

      setQuantity('');
      setStep('form');
      onClose();
    } catch (error) {
      console.error('Trade error:', error);
      alert('Failed to execute trade');
    } finally {
      setLoading(false);
    }
  };

  const totalValue = parseFloat(quantity || '0') * currentPrice;
  const maxQuantity =
    action === 'sell'
      ? portfolio.holdings.find((h) => h.symbol === symbol && h.type === type)?.quantity || 0
      : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'checklist' ? 'Pre-Trade Checklist' : `${action === 'buy' ? 'Buy' : 'Sell'} Asset`}
          </DialogTitle>
          <DialogDescription>
            {step === 'checklist'
              ? 'Review this checklist before confirming your trade'
              : action === 'buy'
                ? 'Search for an asset and enter the quantity to buy'
                : 'Enter the quantity to sell'}
          </DialogDescription>
        </DialogHeader>

        {step === 'checklist' ? (
          <TradeChecklist
            symbol={symbol}
            type={type}
            action={action}
            onConfirm={handleConfirmedTrade}
            onCancel={() => setStep('form')}
          />
        ) : (
          <div className="space-y-4">
            {/* Action Toggle */}
            <div className="flex gap-2">
              <Button
                variant={action === 'buy' ? 'default' : 'glass'}
                onClick={() => setAction('buy')}
                className="flex-1"
              >
                Buy
              </Button>
              <Button
                variant={action === 'sell' ? 'default' : 'glass'}
                onClick={() => setAction('sell')}
                className="flex-1"
              >
                Sell
              </Button>
            </div>

            {/* Asset Search */}
            {!initialSymbol && (
              <div>
                <label className="text-sm font-medium mb-2 block">Select Asset</label>
                <SearchBar
                  onSelectAsset={handleSelectAsset}
                  placeholder="Search stocks or crypto..."
                />
              </div>
            )}

            {/* Selected Asset */}
            {symbol && (
              <div className="glass-card p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-lg">{symbol}</div>
                  <div className="text-xs uppercase bg-brand-500/20 text-brand-500 px-2 py-1 rounded">
                    {type}
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Current Price: {formatCurrency(currentPrice, portfolio.baseCurrency)}
                </div>
                {action === 'sell' && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Available: {maxQuantity} units
                  </div>
                )}
              </div>
            )}

            {/* Divergence Info for buy action */}
            {symbol && action === 'buy' && divergence && divergence.signal !== 'neutral' && (
              <DivergenceInfo divergence={divergence} />
            )}

            {/* Quantity Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quantity</label>
              <Input
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="0.01"
              />
              {action === 'sell' && maxQuantity > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setQuantity(maxQuantity.toString())}
                  className="mt-1 px-0 h-auto text-xs"
                >
                  Sell All ({maxQuantity} units)
                </Button>
              )}
            </div>

            {/* Summary */}
            {quantity && parseFloat(quantity) > 0 && (
              <div className="glass-card p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Value:</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(totalValue, portfolio.baseCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {action === 'buy' ? 'Remaining Balance:' : 'New Balance:'}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(
                      action === 'buy' ? portfolio.balance - totalValue : portfolio.balance + totalValue,
                      portfolio.baseCurrency
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="glass" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handlePreTrade}
                disabled={!symbol || !quantity || parseFloat(quantity) <= 0 || loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : action === 'buy' ? 'Buy Now' : 'Sell Now'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
