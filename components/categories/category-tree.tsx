// components/categories/category-tree.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronRight, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Category } from '@/types/category.types';
import { useRouter } from 'next/navigation';

interface CategoryTreeProps {
  categories: Category[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
  level?: number;
}

interface ExpandedState {
  [key: string]: boolean;
}

/**
 * Recursive tree view component for displaying hierarchical categories
 * Supports expand/collapse, edit, and delete operations
 */
export function CategoryTree({
  categories,
  onEdit,
  onDelete,
  level = 0,
}: CategoryTreeProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleExpand = (id: string): void => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleEdit = (id: string): void => {
    if (onEdit) {
      onEdit(id);
    } else {
      router.push(`/dashboard/categories/${id}/edit`);
    }
  };

  const handleDeleteClick = (id: string): void => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async (id: string): Promise<void> => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(id);
      } else {
        const response = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete category');
        }
      }

      toast.success('Category deleted successfully');
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {level === 0 ? 'No categories found' : 'No subcategories'}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {categories.map(category => (
          <div key={category.id}>
            {/* Category Row */}
            <div
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ paddingLeft: `${(level + 1) * 1}rem` }}
            >
              {/* Expand/Collapse Button */}
              {category.children && category.children.length > 0 ? (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="flex-shrink-0 p-0 hover:bg-gray-200 rounded transition-colors"
                  aria-label={expanded[category.id] ? 'Collapse' : 'Expand'}
                >
                  {expanded[category.id] ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              ) : (
                <div className="w-4" />
              )}

              {/* Category Image */}
              {category.imageUrl ? (
                <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-gray-100">
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Category Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600 truncate">
                    {category.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(category.id)}
                  title="Edit category"
                  className="hover:bg-blue-50"
                >
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(category.id)}
                  title="Delete category"
                  className="hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>

            {/* Recursive Children */}
            {expanded[category.id] && category.children && category.children.length > 0 && (
              <div className="ml-2">
                <CategoryTree
                  categories={category.children}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  level={level + 1}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteId && handleConfirmDelete(deleteId)}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
