'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchBar } from '@/components/shared/SearchBar';
import { useNotificationContext } from '@/contexts/NotificationContext';

export function AlertForm() {
  const { addAlert } = useNotificationContext();
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'stock' | 'crypto'>('stock');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const handleSelectAsset = (selectedSymbol: string, selectedName: string, selectedType: 'stock' | 'crypto') => {
    setSymbol(selectedSymbol);
    setName(selectedName);
    setType(selectedType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!symbol || !targetPrice || parseFloat(targetPrice) <= 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    addAlert({
      symbol,
      name,
      type,
      targetPrice: parseFloat(targetPrice),
      condition,
    });

    // Reset form
    setSymbol('');
    setName('');
    setTargetPrice('');
    setCondition('above');

    alert('Price alert created successfully!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Price Alert</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Asset</label>
            <SearchBar
              onSelectAsset={handleSelectAsset}
              placeholder="Search stocks or crypto..."
            />
          </div>

          {/* Selected Asset */}
          {symbol && (
            <div className="glass-card p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-lg">{name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{symbol}</div>
                </div>
                <div className="text-xs uppercase bg-brand-500/20 text-brand-500 px-2 py-1 rounded">
                  {type}
                </div>
              </div>
            </div>
          )}

          {/* Condition */}
          <div>
            <label className="text-sm font-medium mb-2 block">Alert Condition</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={condition === 'above' ? 'default' : 'glass'}
                onClick={() => setCondition('above')}
                className="flex-1"
              >
                Price Goes Above
              </Button>
              <Button
                type="button"
                variant={condition === 'below' ? 'default' : 'glass'}
                onClick={() => setCondition('below')}
                className="flex-1"
              >
                Price Goes Below
              </Button>
            </div>
          </div>

          {/* Target Price */}
          <div>
            <label className="text-sm font-medium mb-2 block">Target Price</label>
            <Input
              type="number"
              placeholder="Enter target price"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={!symbol}>
            Create Alert
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
