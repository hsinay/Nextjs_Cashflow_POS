// components/customers/segment-badge.tsx


import { CustomerSegment } from '@/types/customer.types';

interface SegmentBadgeProps {
  segment: CustomerSegment;
}

export function SegmentBadge({ segment }: SegmentBadgeProps) {
  let color: string;
  switch (segment) {
    case CustomerSegment.HIGH_VALUE:
      color = 'bg-blue-100 text-blue-800';
      break;
    case CustomerSegment.PRICE_SENSITIVE:
      color = 'bg-yellow-100 text-yellow-800';
      break;
    case CustomerSegment.LOYAL:
      color = 'bg-green-100 text-green-800';
      break;
    case CustomerSegment.OCCASIONAL:
      color = 'bg-gray-100 text-gray-800';
      break;
    case CustomerSegment.NEW:
      color = 'bg-purple-100 text-purple-800';
      break;
    default:
      color = 'bg-gray-100 text-gray-800';
  }
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>{segment}</span>
  );
}
