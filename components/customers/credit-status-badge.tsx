// components/customers/credit-status-badge.tsx

interface CreditStatusBadgeProps {
  outstandingBalance: number;
  creditLimit: number;
}

export function CreditStatusBadge({ outstandingBalance, creditLimit }: CreditStatusBadgeProps) {
  let status: 'Good' | 'Warning' | 'Overdue';
  let color: string;
  if (outstandingBalance === 0) {
    status = 'Good';
    color = 'bg-green-100 text-green-800';
  } else if (outstandingBalance < creditLimit * 0.8) {
    status = 'Warning';
    color = 'bg-yellow-100 text-yellow-800';
  } else {
    status = 'Overdue';
    color = 'bg-red-100 text-red-800';
  }
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>{status}</span>
  );
}
