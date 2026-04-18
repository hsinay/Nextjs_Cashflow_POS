/**
 * Hook for optimistic UI updates on delete operations
 * Removes item from local state immediately and reverts on error
 */

'use client';

import { useToast } from '@/components/ui/use-toast';
import { useCallback, useState } from 'react';

interface UseOptimisticDeleteOptions {
  apiEndpoint: (id: string) => string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useOptimisticDelete<T extends { id: string }>(
  initialItems: T[],
  options: UseOptimisticDeleteOptions
) {
  const { toast } = useToast();
  const [items, setItems] = useState<T[]>(initialItems);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDelete = useCallback(
    async (id: string) => {
      // Find the item to delete
      const itemToDelete = items.find(item => item.id === id);
      if (!itemToDelete) {
        toast({
          title: 'Error',
          description: 'Item not found',
          variant: 'destructive',
        });
        return;
      }

      // Optimistically remove from local state
      const previousItems = items;
      setItems(items.filter(item => item.id !== id));
      setDeletingIds(prev => new Set(prev).add(id));

      try {
        const response = await fetch(options.apiEndpoint(id), {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete item');
        }

        // Success - item is already removed from state
        toast({
          title: 'Success',
          description: 'Item deleted successfully',
        });

        options.onSuccess?.();
      } catch (err) {
        // Revert to previous state on error
        setItems(previousItems);

        const message = err instanceof Error ? err.message : 'Failed to delete item';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });

        options.onError?.(message);
      } finally {
        setDeletingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [items, toast, options]
  );

  const isDeleting = useCallback(
    (id: string) => deletingIds.has(id),
    [deletingIds]
  );

  return {
    items,
    handleDelete,
    isDeleting,
    isSomeDeleting: deletingIds.size > 0,
  };
}
