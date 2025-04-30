
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
    onSuccess: (newSettings) => {
      setSettings(newSettings);
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
        <h1 className="text-2xl font-bold text-white">Rating Engine Settings</h1>
        <Button onClick={handleExport} variant="outline" className="text-white border-white">
          Export Data (CSV)
        </Button>
      </div>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <h2 className="text-xl font-semibold text-white">System Settings</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="dailyBonus" className="text-white">Daily Bonus Amount</Label>
              <Input
                id="dailyBonus"
                type="number"
                value={settings.dailyBonusAmount}
                onChange={(e) => setSettings({ ...settings, dailyBonusAmount: parseInt(e.target.value) })}
                className="text-white bg-gray-800 border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kFactor" className="text-white">K-Factor (Rating Volatility)</Label>
              <Input
                id="kFactor"
                type="number"
                value={settings.kFactor}
                onChange={(e) => setSettings({ ...settings, kFactor: parseInt(e.target.value) })}
                className="text-white bg-gray-800 border-gray-700"
              />
              <p className="text-sm text-gray-400">Higher values = faster rating changes</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialRating" className="text-white">Default Initial Rating</Label>
              <Input
                id="initialRating"
                type="number"
                value={settings.initialRating}
                onChange={(e) => setSettings({ ...settings, initialRating: parseInt(e.target.value) })}
                className="text-white bg-gray-800 border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="victoryMargin" className="text-white">Victory Margin Weight</Label>
              <Select 
                value={settings.victoryMarginWeight}
                onValueChange={(value) => setSettings({ ...settings, victoryMarginWeight: value })}
              >
                <SelectTrigger className="text-white bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select weight"/>
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="low" className="text-white hover:bg-gray-700">Low (0.5x)</SelectItem>
                  <SelectItem value="normal" className="text-white hover:bg-gray-700">Normal (1.0x)</SelectItem>
                  <SelectItem value="high" className="text-white hover:bg-gray-700">High (1.5x)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-400">How much winning by a large margin affects ratings</p>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
