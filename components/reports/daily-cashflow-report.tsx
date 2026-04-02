'use client';

import {
  H2,
  H3,
  KPICard,
  Small,
  StatusBadge,
} from '@/components/ui';
import { Colors, Typography } from '@/lib/design-tokens';
import { formatCurrency } from '@/lib/utils';
import { DailyCashflowReport } from '@/types/report.types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DailyCashflowReportProps {
  data: DailyCashflowReport[];
}

const CHART_COLORS = [Colors.primary.start, Colors.success, Colors.warning, Colors.danger, Colors.primary.end];

export function DailyCashflowReportComponent({ data }: DailyCashflowReportProps) {
  // Summary metrics
  const totalSales = data.reduce((sum, d) => sum + d.salesAmount, 0);
  const totalVariance = data.reduce((sum, d) => sum + d.variance, 0);
  const avgVariancePercentage = data.length > 0
    ? data.reduce((sum, d) => sum + d.variancePercentage, 0) / data.length
    : 0;

  // Chart data
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    sales: d.salesAmount,
    closing: d.closingBalance,
    variance: Math.abs(d.variance),
  }));

  // Payment method breakdown (last day in period)
  const lastDay = data[data.length - 1];
  const paymentData = lastDay
    ? [
      { name: 'Cash', value: lastDay.paymentMethodBreakdown.cash },
      { name: 'Card', value: lastDay.paymentMethodBreakdown.card },
      { name: 'Digital Wallet', value: lastDay.paymentMethodBreakdown.digitalWallet },
      { name: 'Credit', value: lastDay.paymentMethodBreakdown.credit },
    ].filter(item => item.value > 0)
    : [];

  return (
    <div
      className="space-y-6 p-6 rounded-lg"
      style={{
        backgroundColor: 'white',
      }}
    >
      {/* Header */}
      <div>
        <H2>Daily Cashflow Report</H2>
        <Small className="mt-1 block">
          {data.length} days • {new Date(data[0]?.date || '').toLocaleDateString()} to{' '}
          {new Date(data[data.length - 1]?.date || '').toLocaleDateString()}
        </Small>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Sales"
          value={formatCurrency(totalSales)}
          subtext={`${data.length} days`}
        />
        <KPICard
          title="Avg Daily Sales"
          value={formatCurrency(totalSales / data.length)}
          subtext="Average"
        />
        <KPICard
          title="Total Variance"
          value={formatCurrency(totalVariance)}
          subtext={`${avgVariancePercentage.toFixed(2)}%`}
          trend={totalVariance < 0 ? 'negative' : 'positive'}
        />
        <KPICard
          title="Sessions Closed"
          value={data.filter(d => d.status === 'CLOSED' || d.status === 'RECONCILED').length.toString()}
          subtext={`${((data.filter(d => d.status === 'CLOSED' || d.status === 'RECONCILED').length / data.length) * 100).toFixed(0)}%`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div
          className="rounded-lg p-4"
          style={{
            border: `1px solid ${Colors.gray[200]}`,
          }}
        >
          <H3 className="mb-4">Sales Trend</H3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: unknown) => formatCurrency(value as number)} />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Sales" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Closing Balance */}
        <div
          className="rounded-lg p-4"
          style={{
            border: `1px solid ${Colors.gray[200]}`,
          }}
        >
          <H3 className="mb-4">Closing Balance</H3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: unknown) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="closing" fill="#82ca9d" name="Closing Balance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      {paymentData.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{
            border: `1px solid ${Colors.gray[200]}`,
          }}
        >
          <H3 className="mb-4">Payment Method Breakdown</H3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }: { name?: string; value: number }) => `${name || 'Unknown'}: ${formatCurrency(value)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: unknown) => formatCurrency(value as number)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Table */}
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
                Date
              </th>
              <th
                className="px-4 py-3 text-right font-semibold"
                style={{
                  fontSize: Typography.fontSize.small,
                  color: Colors.text.primary,
                }}
              >
                Opening
              </th>
              <th
                className="px-4 py-3 text-right font-semibold"
                style={{
                  fontSize: Typography.fontSize.small,
                  color: Colors.text.primary,
                }}
              >
                Sales
              </th>
              <th
                className="px-4 py-3 text-right font-semibold"
                style={{
                  fontSize: Typography.fontSize.small,
                  color: Colors.text.primary,
                }}
              >
                Expenses
              </th>
              <th
                className="px-4 py-3 text-right font-semibold"
                style={{
                  fontSize: Typography.fontSize.small,
                  color: Colors.text.primary,
                }}
              >
                Closing
              </th>
              <th
                className="px-4 py-3 text-right font-semibold"
                style={{
                  fontSize: Typography.fontSize.small,
                  color: Colors.text.primary,
                }}
              >
                Variance
              </th>
              <th
                className="px-4 py-3 text-left font-semibold"
                style={{
                  fontSize: Typography.fontSize.small,
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
            {data.map((row, idx) => (
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
                    fontSize: Typography.fontSize.small,
                    color: Colors.text.primary,
                  }}
                >
                  {new Date(row.date).toLocaleDateString()}
                </td>
                <td
                  className="px-4 py-3 text-right"
                  style={{
                    fontSize: Typography.fontSize.small,
                    color: Colors.text.primary,
                  }}
                >
                  {formatCurrency(row.openingBalance)}
                </td>
                <td
                  className="px-4 py-3 text-right"
                  style={{
                    fontSize: Typography.fontSize.small,
                    color: Colors.text.primary,
                  }}
                >
                  {formatCurrency(row.salesAmount)}
                </td>
                <td
                  className="px-4 py-3 text-right"
                  style={{
                    fontSize: Typography.fontSize.small,
                    color: Colors.text.primary,
                  }}
                >
                  {formatCurrency(row.expenses)}
                </td>
                <td
                  className="px-4 py-3 text-right"
                  style={{
                    fontSize: Typography.fontSize.small,
                    color: Colors.text.primary,
                  }}
                >
                  {formatCurrency(row.closingBalance)}
                </td>
                <td
                  className="px-4 py-3 text-right font-semibold"
                  style={{
                    fontSize: Typography.fontSize.small,
                    color: row.variance >= 0 ? Colors.success : Colors.danger,
                  }}
                >
                  {formatCurrency(row.variance)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={
                      row.status === 'RECONCILED'
                        ? 'PAID'
                        : row.status === 'CLOSED'
                          ? 'PENDING'
                          : 'OPEN'
                    }
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
