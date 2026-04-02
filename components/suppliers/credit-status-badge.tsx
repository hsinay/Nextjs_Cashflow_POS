// components/suppliers/credit-status-badge.tsx

interface CreditStatusBadgeProps {
  outstandingBalance: number;
  creditLimit: number;
}

export function CreditStatusBadge({ outstandingBalance, creditLimit }: CreditStatusBadgeProps) {
  let status: 'Good' | 'Warning' | 'Over Limit';
  let color: string;
  
  const percent = creditLimit > 0 ? (outstandingBalance / creditLimit) * 100 : 0;
  
  if (percent < 50) {
    status = 'Good';
    color = 'bg-green-100 text-green-800';
  } else if (percent < 90) {
    status = 'Warning';
    color = 'bg-yellow-100 text-yellow-800';
  } else {
    status = 'Over Limit';
    color = 'bg-red-100 text-red-800';
  }
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
}
