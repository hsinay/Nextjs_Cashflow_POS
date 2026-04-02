'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { PhysicalInventoryLine } from '@/types/physical-inventory.types';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CountLineTableProps {
  lines: PhysicalInventoryLine[];
  piId: string;
  piStatus: string;
}

export function CountLineTable({
  lines,
  piId,
  piStatus,
}: CountLineTableProps) {
  const [deletingLineId, setDeletingLineId] = useState<string | null>(null);

  const handleDeleteLine = async (lineId: string) => {
    try {
      const res = await fetch(
        `/api/physical-inventory/${piId}/lines/${lineId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) throw new Error('Failed to delete line');
      // Data will be refreshed by parent page reload if needed
    } catch (error) {
      console.error('Error deleting line:', error);
    } finally {
      setDeletingLineId(null);
    }
  };

  const getVarianceColor = (variance: number | null) => {
    if (variance === null) return 'text-gray-500';
    if (variance === 0) return 'text-green-600 font-bold';
    if (variance > 0) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
  };

  if (lines.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-slate-500">
        <p>No count lines yet. Add a count line to get started.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">System Qty</TableHead>
            <TableHead className="text-right">Physical Qty</TableHead>
            <TableHead className="text-right">Variance</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Expiry Date</TableHead>
            {piStatus === 'DRAFT' && <TableHead className="text-center">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell className="font-medium">
                {line.product?.name || 'Unknown Product'}
              </TableCell>
              <TableCell className="text-right">{line.systemQuantity}</TableCell>
              <TableCell className="text-right">
                {line.physicalQuantity ?? '-'}
              </TableCell>
              <TableCell className={`text-right ${getVarianceColor(line.variance)}`}>
                {line.variance !== null ? (
                  <>
                    {line.variance > 0 ? '+' : ''}{line.variance}
                    {Math.abs(line.variance) > 5 && (
                      <AlertTriangle className="h-3 w-3 ml-2 inline" />
                    )}
                  </>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{line.batchNumber || '-'}</TableCell>
              <TableCell>{line.expiryDate ? new Date(line.expiryDate).toLocaleDateString() : '-'}</TableCell>
              {piStatus === 'DRAFT' && (
                <TableCell className="text-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingLineId === line.id}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Delete Count Line?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the count entry for {line.product?.name}. This
                        action cannot be undone.
                      </AlertDialogDescription>
                      <div className="flex gap-2 justify-end">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteLine(line.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
