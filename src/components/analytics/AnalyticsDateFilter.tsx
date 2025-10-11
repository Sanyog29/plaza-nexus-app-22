import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DatePreset, DateRange } from '@/hooks/useAdvancedAnalytics';

interface AnalyticsDateFilterProps {
  dateRange: DateRange;
  preset: DatePreset;
  comparisonEnabled: boolean;
  onPresetChange: (preset: DatePreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
  onComparisonToggle: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const presetOptions: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'mtd', label: 'Month to Date' },
  { value: 'qtd', label: 'Quarter to Date' },
  { value: 'ytd', label: 'Year to Date' },
];

export const AnalyticsDateFilter: React.FC<AnalyticsDateFilterProps> = ({
  dateRange,
  preset,
  comparisonEnabled,
  onPresetChange,
  onCustomRangeChange,
  onComparisonToggle,
  onRefresh,
  isLoading = false
}) => {
  const [customRange, setCustomRange] = React.useState<DateRange>(dateRange);

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-card border border-border rounded-lg">
      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        {presetOptions.map((option) => (
          <Button
            key={option.value}
            variant={preset === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPresetChange(option.value)}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={preset === 'custom' ? 'default' : 'outline'}
            size="sm"
            className={cn("text-xs justify-start", preset === 'custom' && "border-primary")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {preset === 'custom' 
              ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
              : 'Custom Range'
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div>
              <Label className="text-xs font-semibold mb-2 block">From Date</Label>
              <Calendar
                mode="single"
                selected={customRange.from}
                onSelect={(date) => date && setCustomRange({ ...customRange, from: date })}
                initialFocus
                className="pointer-events-auto"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-2 block">To Date</Label>
              <Calendar
                mode="single"
                selected={customRange.to}
                onSelect={(date) => date && setCustomRange({ ...customRange, to: date })}
                className="pointer-events-auto"
                disabled={(date) => date < customRange.from}
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                onCustomRangeChange(customRange);
              }}
            >
              Apply Custom Range
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Comparison Toggle */}
      <div className="flex items-center gap-2 ml-auto">
        <Switch
          id="comparison"
          checked={comparisonEnabled}
          onCheckedChange={onComparisonToggle}
        />
        <Label htmlFor="comparison" className="text-xs cursor-pointer">
          Compare with previous period
        </Label>
      </div>

      {/* Refresh Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
      </Button>

      {/* Current Selection Display */}
      <div className="w-full text-xs text-muted-foreground mt-2">
        Showing data from <span className="font-semibold">{format(dateRange.from, 'PPP')}</span> to{' '}
        <span className="font-semibold">{format(dateRange.to, 'PPP')}</span>
      </div>
    </div>
  );
};