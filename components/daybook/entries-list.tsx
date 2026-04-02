"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { DayBookEntryType, PaymentMethod } from "@prisma/client";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatDateTime(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }) + " " + date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

interface DayBookEntry {
  id: string;
  entryType: DayBookEntryType;
  entryDate: Date | string;
  description: string;
  amount: number | { toNumber: () => number };
  paymentMethod?: PaymentMethod;
  partyName?: string;
  createdBy?: { username: string };
}

interface EntriesListProps {
  entries: DayBookEntry[];
  isOpen?: boolean;
  onDelete?: (entryId: string) => Promise<void>;
}

function getValue(value: any): number {
  if (typeof value === "number") return value;
  if (value && typeof value.toNumber === "function") return value.toNumber();
  return 0;
}

const entryTypeColors: Record<string, string> = {
  SALE: "bg-green-100 text-green-800",
  PURCHASE: "bg-red-100 text-red-800",
  EXPENSE: "bg-orange-100 text-orange-800",
  PAYMENT_IN: "bg-blue-100 text-blue-800",
  PAYMENT_OUT: "bg-purple-100 text-purple-800",
  BANK_DEPOSIT: "bg-cyan-100 text-cyan-800",
  BANK_WITHDRAWAL: "bg-indigo-100 text-indigo-800",
};

export function EntriesList({
  entries,
  isOpen = true,
  onDelete,
}: EntriesListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (entryId: string) => {
    if (!isOpen) {
      toast.error("Cannot delete entries from closed day books");
      return;
    }

    setDeleting(entryId);
    try {
      if (onDelete) {
        await onDelete(entryId);
      } else {
        const response = await fetch(`/api/daybook/entries/${entryId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete entry");
        }

        toast.success("Entry deleted");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete entry"
      );
    } finally {
      setDeleting(null);
    }
  };

  if (!entries || entries.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No entries yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <Card key={entry.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={entryTypeColors[entry.entryType]}>
                  {entry.entryType.replace(/_/g, " ")}
                </Badge>
                <span className="text-sm text-gray-600">
                  {formatDateTime(entry.entryDate)}
                </span>
              </div>

              <p className="font-medium">{entry.description}</p>

              <div className="flex flex-wrap gap-3 text-sm">
                {entry.paymentMethod && (
                  <span className="text-gray-600">
                    Method: {entry.paymentMethod}
                  </span>
                )}
                {entry.partyName && (
                  <span className="text-gray-600">Party: {entry.partyName}</span>
                )}
                {entry.createdBy && (
                  <span className="text-gray-600">
                    By: {entry.createdBy.username}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-semibold">
                  {formatCurrency(getValue(entry.amount))}
                </p>
              </div>

              {isOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleting === entry.id}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
