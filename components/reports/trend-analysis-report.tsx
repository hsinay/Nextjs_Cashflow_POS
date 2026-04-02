'use client';

import { H2, H3, KPICard, Small } from '@/components/ui';
import { Colors, Typography } from '@/lib/design-tokens';
import { formatCurrency } from '@/lib/utils';
import { TrendAnalysis } from '@/types/report.types';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface TrendAnalysisComponentProps {
  data: TrendAnalysis;
  chartType?: 'LINE' | 'AREA';
}

export function TrendAnalysisComponent({ data, chartType = 'LINE' }: TrendAnalysisComponentProps) {
  const getTrendIcon = () => {
    if (data.trend === 'UPWARD') return <TrendingUp className="w-5 h-5" style={{ color: Colors.success }} />;
    if (data.trend === 'DOWNWARD') return <TrendingDown className="w-5 h-5" style={{ color: Colors.danger }} />;
    return <Minus className="w-5 h-5" style={{ color: Colors.text.secondary }} />;
  };

  const getTrendColor = () => {
    if (data.trend === 'UPWARD') return Colors.success;
    if (data.trend === 'DOWNWARD') return Colors.danger;
    return Colors.text.primary;
  };

  return (
    <div
      className="space-y-6 p-6 rounded-lg"
      style={{
        backgroundColor: 'white',
      }}
    >
      {/* Header */}
      <div>
        <H2>Trend Analysis</H2>
        <Small className="mt-1 block">{data.period}</Small>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <KPICard title="Average" value={formatCurrency(data.averageValue)} />
        <KPICard title="Minimum" value={formatCurrency(data.minValue)} />
        <KPICard title="Maximum" value={formatCurrency(data.maxValue)} />
        <KPICard
          title="Growth Rate"
          value={`${data.growthRate.toFixed(1)}%`}
          trend={data.growthRate > 0 ? 'positive' : 'negative'}
        />
        <KPICard
          title="Trend"
          value={data.trend}
          icon={getTrendIcon()}
        />
      </div>

      {/* Trend Summary */}
      <div
        className="border rounded-lg p-6"
        style={{
          background: `linear-gradient(to right, rgba(${
            data.trend === 'UPWARD' ? '240, 253, 244' : data.trend === 'DOWNWARD' ? '254, 242, 242' : '249, 250, 251'
          }))`,
          borderColor: Colors.gray[200],
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <Small className="block uppercase" style={{ color: Colors.text.secondary }}>
              Overall Trend
            </Small>
            <div
              className="text-4xl font-bold mt-2"
              style={{ color: getTrendTextColor() }}
            >
              {data.trend}
            </div>
            <Small className="mt-2 block">
              {data.growthRate > 0 ? 'Growing steadily' : data.growthRate < 0 ? 'Declining' : 'Stable'}
            </Small>
          </div>
          <div className="text-5xl">{getTrendIcon()}</div>
        </div>
      </div>

      {/* Main Chart */}
      <div
        className="rounded-lg p-4"
        style={{
          border: `1px solid ${Colors.gray[200]}`,
        }}
      >
        <H3 className="mb-4">
          {chartType === 'AREA' ? 'Area' : 'Line'} Chart
        </H3>
        <ResponsiveContainer width="100%" height={350}>
          {chartType === 'AREA' ? (
            <AreaChart data={data.dataPoints}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: unknown) => formatCurrency(value as number)} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorValue)"
                name="Sales"
              />
            </AreaChart>
          ) : (
            <LineChart data={data.dataPoints}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: unknown) => formatCurrency(value as number)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                name="Sales"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Data Points"
          value={data.dataPoints.length.toString()}
          subtext="periods analyzed"
        />
        <KPICard
          title="Average Growth"
          value={`${(data.growthRate / data.dataPoints.length).toFixed(2)}%`}
          subtext="per period"
        />
        <KPICard
          title="Range"
          value={formatCurrency(data.maxValue - data.minValue)}
          subtext={`${((((data.maxValue - data.minValue) / data.minValue) * 100) || 0).toFixed(1)}% of min`}
        />
      </div>

      {/* Data Table */}
      <div
        className="overflow-hidden rounded-lg"
        style={{
          border: `1px solid ${Colors.gray[200]}`,
        }}
      >
        <table className="w-full">
          <thead style={{ backgroundColor: Colors.gray[50] }}>
            <tr>
              <th
                className="px-4 py-3 text-left font-semibold"
                style={{
                  fontSize: Typography.fontSize.small,
                  color: Colors.text.primary,
                }}
              >
                Period
              </th>
              <th
                className="px-4 py-3 text-right font-semibold"
                style={{
                  fontSize: Typography.fontSize.small,
                  color: Colors.text.primary,
                }}
              >
                Amount
              </th>
              <th
                className="px-4 py-3 text-right font-semibold"
                style={{
                  fontSize: Typography.fontSize.small,
                  color: Colors.text.primary,
                }}
              >
                vs Avg
              </th>
            </tr>
          </thead>
          <tbody
            style={{
              borderTop: `1px solid ${Colors.gray[200]}`,
            }}
          >
            {data.dataPoints.map((point, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: `1px solid ${Colors.gray[200]}`,
                  backgroundColor: idx % 2 === 0 ? 'white' : Colors.gray[50],
                }}
                className="hover:opacity-75 transition-opacity"
              >
                <td
                  className="px-4 py-3"
                  style={{
                    fontSize: Typography.sizes.sm,
                    color: Colors.text.primary,
                  }}
                >
                  {point.label}
                </td>
                <td
                  className="px-4 py-3 text-right font-semibold"
                  style={{
                    fontSize: Typography.sizes.sm,
                    color: Colors.text.primary,
                  }}
                >
                  {formatCurrency(point.value)}
                </td>
                <td
                  className="px-4 py-3 text-right font-semibold"
                  style={{
                    fontSize: Typography.sizes.sm,
                    color: point.value > data.averageValue ? Colors.success : Colors.danger,
                  }}
                >
                  {point.value > data.averageValue ? '+' : ''}
                  {formatCurrency(point.value - data.averageValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
