
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface RatingSettings {
  dailyBonusAmount: number;
  kFactor: number;
  initialRating: number;
  victoryMarginWeight: string;
}

export default function AdminScreen() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<RatingSettings>({
    dailyBonusAmount: 15,
    kFactor: 32,
    initialRating: 1500,
    victoryMarginWeight: 'normal'
  });

  const { data: currentSettings } = useQuery<RatingSettings>({
    queryKey: ['/api/rating-settings'],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: RatingSettings) => {
      const response = await apiRequest('POST', '/api/rating-settings', settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings Updated',
        description: 'Rating engine settings have been saved.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update settings.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settings);
  };

  const handleExport = async () => {
    const response = await apiRequest('GET', '/api/export-ratings');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ratings.csv';
    a.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Rating Engine Settings</h1>
        <Button onClick={handleExport} variant="outline">
          Export Data (CSV)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">System Settings</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="dailyBonus">Daily Bonus Amount</Label>
              <Input
                id="dailyBonus"
                type="number"
                value={settings.dailyBonusAmount}
                onChange={(e) => setSettings({ ...settings, dailyBonusAmount: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kFactor">K-Factor (Rating Volatility)</Label>
              <Input
                id="kFactor"
                type="number"
                value={settings.kFactor}
                onChange={(e) => setSettings({ ...settings, kFactor: parseInt(e.target.value) })}
              />
              <p className="text-sm text-gray-500">Higher values = faster rating changes</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialRating">Default Initial Rating</Label>
              <Input
                id="initialRating"
                type="number"
                value={settings.initialRating}
                onChange={(e) => setSettings({ ...settings, initialRating: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="victoryMargin">Victory Margin Weight</Label>
              <Select 
                value={settings.victoryMarginWeight}
                onValueChange={(value) => setSettings({ ...settings, victoryMarginWeight: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weight"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (0.5x)</SelectItem>
                  <SelectItem value="normal">Normal (1.0x)</SelectItem>
                  <SelectItem value="high">High (1.5x)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">How much winning by a large margin affects ratings</p>
            </div>

            <Button type="submit" className="w-full">
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
