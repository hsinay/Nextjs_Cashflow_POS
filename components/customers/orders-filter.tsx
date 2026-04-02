'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function OrdersFilter({ currentStatus }: { currentStatus: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', status);
    params.set('page', '1'); // Reset to first page
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="mb-4">
      <label>Status:</label>
      <select
        defaultValue={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="ml-2 px-3 py-2 border rounded"
      >
        <option value="ALL">All</option>
        <option value="PAID">Paid</option>
        <option value="UNPAID">Unpaid</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
    </div>
  );
}
