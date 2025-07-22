import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SalesChartProps {
  data: any[];
  title: string;
  type?: 'line' | 'bar';
  dataKey: string;
  period: string;
  onPeriodChange: (period: string) => void;
}

const SalesChart: React.FC<SalesChartProps> = ({
  data,
  title,
  type = 'line',
  dataKey,
  period,
  onPeriodChange
}) => {
  const formatValue = (value: number, key: string) => {
    if (key.includes('revenue') || key.includes('amount')) {
      return `$${value.toFixed(2)}`;
    }
    return value.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (period === '7d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (period === '30d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 days</SelectItem>
            <SelectItem value="30d">30 days</SelectItem>
            <SelectItem value="90d">90 days</SelectItem>
            <SelectItem value="1y">1 year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(label) => formatDate(label)}
                  formatter={(value, name) => [formatValue(Number(value), String(name)), String(name)]}
                />
                <Line 
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(label) => formatDate(label)}
                  formatter={(value, name) => [formatValue(Number(value), String(name)), String(name)]}
                />
                <Bar 
                  dataKey={dataKey} 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesChart;