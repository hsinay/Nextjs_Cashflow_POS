'use client';

import { H2, H3, KPICard, Small, StatusBadge } from '@/components/ui';
import { Colors } from '@/lib/design-tokens';
import { formatCurrency } from '@/lib/utils';
import { VarianceAnalysis } from '@/types/report.types';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface VarianceAnalysisComponentProps {
  data: VarianceAnalysis;
}

export function VarianceAnalysisComponent({ data }: VarianceAnalysisComponentProps) {
  const chartData = data.sessions.map(s => ({
    date: new Date(s.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    variance: Math.abs(s.variance),
    isOverage: s.variance >= 0,
  }));

  const getTrendIcon = () => {
    if (data.trend === 'IMPROVING') return <TrendingUp className="w-5 h-5" style={{ color: Colors.success }} />;
    if (data.trend === 'DECLINING') return <TrendingDown className="w-5 h-5" style={{ color: Colors.danger }} />;
    return <Minus className="w-5 h-5" style={{ color: Colors.text.secondary }} />;
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
        <H2>Variance Analysis</H2>
        <Small className="mt-1 block">{data.period}</Small>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Expected"
          value={formatCurrency(data.totalExpectedAmount)}
        />
        <KPICard
          title="Actual Amount"
          value={formatCurrency(data.actualAmount)}
        />
        <KPICard
          title="Total Variance"
          value={formatCurrency(Math.abs(data.variance))}
          subtext={`${data.variance_type}`}
          trend={data.variance >= 0 ? 'positive' : 'negative'}
        />
        <KPICard
          title="Trend"
          value={data.trend}
          icon={getTrendIcon()}
        />
      </div>

      {/* Variance Percentage */}
      <div
        className="border rounded-lg p-6"
        style={{
          background: data.variance >= 0
            ? 'linear-gradient(to right, #f0fdf4, #dcfce7)'
            : 'linear-gradient(to right, #fef2f2, #fed7aa)',
          borderColor: data.variance >= 0 ? Colors.success : Colors.danger,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <Small className="block uppercase" style={{ color: Colors.text.secondary }}>
              Variance Percentage
            </Small>
            <div
              className="text-4xl font-bold mt-2"
              style={{ color: Colors.text.primary }}
            >
              {data.variancePercentage.toFixed(2)}%
            </div>
            <Small className="mt-2 block">
              {data.variance_type === 'OVERAGE' ? '✓ Overage detected' : '✗ Shortage detected'}
            </Small>
          </div>
          <div
            className="inline-block px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: data.variance >= 0 ? Colors.success : Colors.danger,
              color: 'white',
            }}
          >
            {formatCurrency(data.variance)}
          </div>
        </div>
      </div>

      {/* Variance Trend Chart */}
      <div
        className="rounded-lg p-4"
        style={{
          border: `1px solid ${Colors.gray[200]}`,
        }}
      >
        <H3 className="mb-4">Variance Trend</H3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: unknown) => formatCurrency(value as number)} />
            <Bar
              dataKey="variance"
              fill="#8884d8"
              name="Variance Amount"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sessions Table */}
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
                  fontSize: '12px',
                  color: Colors.text.primary,
                }}
              >
                Date
              </th>
              <th
                className="px-4 py-3 text-right font-semibold"
                style={{
                  fontSize: '12px',
                  color: Colors.text.primary,
                }}
              >
                Variance
              </th>
              <th
                className="px-4 py-3 text-right font-semibold"
                style={{
                  fontSize: '12px',
                  color: Colors.text.primary,
                }}
              >
                %
              </th>
              <th
                className="px-4 py-3 text-left font-semibold"
                style={{
                  fontSize: '12px',
                  color: Colors.text.primary,
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody
            style={{
              borderTop: `1px solid ${Colors.gray[200]}`,
            }}
          >
            {data.sessions.map((session, idx) => (
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
                    fontSize: '12px',
                    color: Colors.text.primary,
                  }}
                >
                  {new Date(session.date).toLocaleDateString()}
                </td>
                <td
                  className="px-4 py-3 text-right font-semibold"
                  style={{
                    fontSize: '12px',
                    color: session.variance >= 0 ? Colors.success : Colors.danger,
                  }}
                >
                  {formatCurrency(session.variance)}
                </td>
                <td
                  className="px-4 py-3 text-right font-semibold"
                  style={{
                    fontSize: '12px',
                    color: session.variancePercentage >= 0 ? Colors.success : Colors.danger,
                  }}
                >
                  {session.variancePercentage.toFixed(2)}%
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={session.status === 'RECONCILED' ? 'PAID' : 'PENDING'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
