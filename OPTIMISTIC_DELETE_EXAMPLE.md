/\*\*

- Example implementation of optimistic delete hook
- Shows how to use useOptimisticDelete in list components
  \*/

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOptimisticDelete } from '@/hooks/use-optimistic-delete';

interface Item {
id: string;
name: string;
}

interface OptimisticListExampleProps {
initialItems: Item[];
}

export function OptimisticListExample({ initialItems }: OptimisticListExampleProps) {
const [deleteId, setDeleteId] = useState<string | null>(null);
const { items, handleDelete, isDeleting } = useOptimisticDelete(initialItems, {
apiEndpoint: (id) => `/api/items/${id}`,
onSuccess: () => {
setDeleteId(null);
},
});

const handleDeleteClick = async (id: string) => {
setDeleteId(id);
await handleDelete(id);
};

return (
<div className="space-y-4">
{items.map((item) => (
<div key={item.id} className="flex items-center justify-between p-4 border rounded">
<div>
<p className="font-medium">{item.name}</p>
<p className="text-sm text-gray-500">{item.id}</p>
</div>
<Button
variant="destructive"
size="sm"
onClick={() => handleDeleteClick(item.id)}
disabled={isDeleting(item.id)} >
{isDeleting(item.id) ? 'Deleting...' : 'Delete'}
</Button>
</div>
))}

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No items found</p>
        </div>
      )}
    </div>

);
}
