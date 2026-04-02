// components/customers/loyalty-badge.tsx

interface LoyaltyBadgeProps {
  points: number;
}

export function LoyaltyBadge({ points }: LoyaltyBadgeProps) {
  let tier: string;
  let color: string;
  if (points >= 1000) {
    tier = 'Platinum';
    color = 'bg-purple-100 text-purple-800';
  } else if (points >= 500) {
    tier = 'Gold';
    color = 'bg-yellow-100 text-yellow-800';
  } else if (points >= 100) {
    tier = 'Silver';
    color = 'bg-gray-100 text-gray-800';
  } else {
    tier = 'Bronze';
    color = 'bg-orange-100 text-orange-800';
  }
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>{tier}</span>
  );
}
