'use client';

import { Small } from '@/components/ui';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { BorderRadius, Colors, Spacing } from '@/lib/design-tokens';
import { AlertCircle, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PricelistListProps {
  pricelists: any[];
  error?: string | null;
}

export function PricelistList({ pricelists, error }: PricelistListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debug logging
  console.log('PricelistList Component Rendered');
  console.log('Pricelists received:', pricelists);
  console.log('Error received:', error);
  console.log('Pricelists count:', pricelists?.length ?? 'undefined');

  const handleConfirmDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/pricelists/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete pricelist');
      }

      toast({
        title: 'Success',
        description: 'Pricelist deleted successfully',
      });

      setDeleteId(null);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete pricelist';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <Card style={{ padding: Spacing.md, marginBottom: Spacing.lg, borderColor: Colors.danger, backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
        <p style={{ color: Colors.danger }}>{error}</p>
      </Card>
    );
  }

  if (pricelists.length === 0) {
    return (
      <Card style={{ padding: Spacing.xxxl, textAlign: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: Colors.text.primary, marginBottom: Spacing.sm }}>
          No pricelists yet
        </h3>
        <Small color={Colors.text.secondary} className="mb-6">
          Create your first pricelist to start managing product pricing
        </Small>
        <Link href="/dashboard/pricelists/new">
          <Button
            style={{
              backgroundColor: Colors.primary.start,
              color: '#ffffff',
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Pricelist
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.md }}>
        {pricelists.map((pricelist: any) => (
          <Card
            key={pricelist.id}
            style={{ padding: Spacing.lg }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.lg }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: Colors.text.primary }}>
                    {pricelist.name}
                  </h3>
                  <span
                    style={{
                      padding: `${Spacing.xs} ${Spacing.sm}`,
                      borderRadius: BorderRadius.full,
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: pricelist.isActive
                        ? Colors.success + '20'
                        : Colors.gray[100],
                      color: pricelist.isActive ? Colors.success : Colors.text.secondary,
                    }}
                  >
                    {pricelist.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: Colors.text.secondary }}>
                    Priority: {pricelist.priority}
                  </span>
                </div>

                {pricelist.description && (
                  <Small color={Colors.text.secondary} style={{ marginBottom: Spacing.md }}>
                    {pricelist.description}
                  </Small>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: Spacing.md,
                    fontSize: '14px',
                  }}
                >
                  <div>
                    <Small color={Colors.text.secondary}>Rules</Small>
                    <p style={{ fontWeight: '600', color: Colors.text.primary }}>
                      {pricelist.rules.length}
                    </p>
                  </div>
                  <div>
                    <Small color={Colors.text.secondary}>Products Covered</Small>
                    <p style={{ fontWeight: '600', color: Colors.text.primary }}>
                      {pricelist.items.length}
                    </p>
                  </div>
                  <div>
                    <Small color={Colors.text.secondary}>Currency</Small>
                    <p style={{ fontWeight: '600', color: Colors.text.primary }}>
                      {pricelist.currency}
                    </p>
                  </div>
                  <div suppressHydrationWarning>
                    <Small color={Colors.text.secondary}>Valid Period</Small>
                    <p style={{ fontWeight: '600', color: Colors.text.primary }}>
                      {pricelist.startDate && pricelist.endDate
                        ? 'Configured'
                        : pricelist.startDate
                        ? 'Start date set'
                        : pricelist.endDate
                        ? 'End date set'
                        : 'Always active'}
                    </p>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: Spacing.sm,
                  alignItems: 'stretch',
                  minWidth: '160px',
                }}
              >
                <Link href={`/dashboard/pricelists/${pricelist.id}`}>
                  <Button variant="outline" size="sm" className="gap-2 w-full">
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                </Link>
                <Link href={`/dashboard/pricelists/${pricelist.id}/edit`}>
                  <Button variant="outline" size="sm" className="gap-2 w-full">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2 w-full"
                  onClick={() => setDeleteId(pricelist.id)}
                  style={{
                    backgroundColor: Colors.danger,
                    borderColor: Colors.danger,
                    color: Colors.white,
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Delete Pricelist
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pricelist? All associated pricing rules will also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleConfirmDelete(deleteId)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
