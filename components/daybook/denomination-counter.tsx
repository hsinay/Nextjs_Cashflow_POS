"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const symbol = getCurrencySymbol();
const DENOMINATIONS = [
  { value: 2000, label: `${symbol}2000` },
  { value: 500, label: `${symbol}500` },
  { value: 100, label: `${symbol}100` },
  { value: 50, label: `${symbol}50` },
  { value: 20, label: `${symbol}20` },
  { value: 10, label: `${symbol}10` },
  { value: 5, label: `${symbol}5` },
  { value: 2, label: `${symbol}2` },
  { value: 1, label: `${symbol}1` },
];

const denominationSchema = z.object({
  quantities: z.record(z.string(), z.coerce.number().nonnegative()),
});

type DenominationFormValues = z.infer<typeof denominationSchema>;

interface DenominationCounterProps {
  dayBookId: string;
  onSuccess?: (summary: any) => void;
}

export function DenominationCounter({
  dayBookId,
  onSuccess,
}: DenominationCounterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const form = useForm<DenominationFormValues, unknown, DenominationFormValues>({
    resolver: zodResolver(denominationSchema),
    defaultValues: {
      quantities: DENOMINATIONS.reduce(
        (acc, d) => ({ ...acc, [d.value]: 0 }),
        {} as Record<string, number>
      ),
    },
  });

  const quantities = form.watch("quantities");

  // Calculate total amount
  const calculateTotal = useCallback(() => {
    const total = Object.entries(quantities).reduce((sum, [denom, qty]) => {
      return sum + parseInt(denom) * (qty || 0);
    }, 0);
    setTotalAmount(total);
  }, [quantities]);

  // Recalculate whenever quantities change
  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  const onSubmit = async (data: DenominationFormValues) => {
    setIsLoading(true);
    try {
      const denominations = DENOMINATIONS.map((d) => ({
        denomination: d.value,
        quantity: parseInt((data.quantities[d.value] as any) || 0),
      }));

      const response = await fetch(`/api/daybook/${dayBookId}/reconcile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ denominations }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to record denominations");
        return;
      }

      const result = await response.json();
      toast.success("Denominations recorded successfully");

      if (onSuccess) {
        onSuccess(result.data);
      }
    } catch (error) {
      console.error("Error recording denominations:", error);
      toast.error("An error occurred while recording denominations");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Cash Denomination Counter</h3>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {DENOMINATIONS.map((denom) => {
              // @ts-ignore
              return (
                <FormField
                  key={denom.value}
                  control={form.control as any}
                  name={`quantities.${denom.value}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">{denom.label}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            calculateTotal();
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-gray-600 mb-2">Total Amount</div>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(totalAmount)}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              "Record & Reconcile"
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
