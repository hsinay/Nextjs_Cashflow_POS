// components/customers/churn-risk-indicator.tsx

interface ChurnRiskIndicatorProps {
  score: number; // 0-1 scale
}

export function ChurnRiskIndicator({ score }: ChurnRiskIndicatorProps) {
  let label: string;
  let color: string;
  
  if (score < 0.3) {
    label = 'Low Risk';
    color = 'bg-green-100 text-green-800';
  } else if (score < 0.7) {
    label = 'Medium Risk';
    color = 'bg-yellow-100 text-yellow-800';
  } else {
    label = 'High Risk';
    color = 'bg-red-100 text-red-800';
  }
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}
