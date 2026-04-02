"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createDayBookEntrySchema } from "@/lib/validations/daybook.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { DayBookEntryType, PaymentMethod } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface EntryFormProps {
  dayBookId: string;
  onSuccess?: (entry: any) => void;
  categories?: Array<{ id: string; name: string }>;
}

type EntryFormValues = {
  entryType: DayBookEntryType;
  entryDate: Date;
  description: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  referenceType?: string;
  referenceId?: string;
  partyType?: string;
  partyName?: string;
  expenseCategoryId?: string;
  notes?: string;
};

export function DayBookEntryForm({
  dayBookId,
  onSuccess,
  categories = [],
}: EntryFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EntryFormValues, unknown, EntryFormValues>({
    resolver: zodResolver(createDayBookEntrySchema.omit({ dayBookId: true })),
    defaultValues: {
      entryType: "SALE" as DayBookEntryType,
      entryDate: new Date(),
      description: "",
      amount: 0,
      paymentMethod: "CASH" as const,
    },
  });

  const onSubmit = async (data: EntryFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/daybook/${dayBookId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to create entry");
        return;
      }

      const result = await response.json();
      toast.success("Entry created successfully");

      if (onSuccess) {
        onSuccess(result.data);
      }

      form.reset();
    } catch (error) {
      console.error("Error creating entry:", error);
      toast.error("An error occurred while creating the entry");
    } finally {
      setIsLoading(false);
    }
  };

  const entryType = form.watch("entryType");

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Add Entry</h3>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* @ts-ignore */}
            <FormField
              control={form.control as any}
              name="entryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SALE">Sale</SelectItem>
                      <SelectItem value="PURCHASE">Purchase</SelectItem>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
                      <SelectItem value="PAYMENT_IN">Payment In</SelectItem>
                      <SelectItem value="PAYMENT_OUT">Payment Out</SelectItem>
                      <SelectItem value="BANK_DEPOSIT">Bank Deposit</SelectItem>
                      <SelectItem value="BANK_WITHDRAWAL">Bank Withdrawal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* @ts-ignore */}
            <FormField
              control={form.control as any}
              name="entryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* @ts-ignore */}
          <FormField
            control={form.control as any}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Enter description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            {/* @ts-ignore */}
            <FormField
              control={form.control as any}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* @ts-ignore */}
            <FormField
              control={form.control as any}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="DIGITAL_WALLET">Digital Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {entryType === "EXPENSE" && (
            /* @ts-ignore */
            <FormField
              control={form.control as any}
              name="expenseCategoryId"
              render={({ field }) => {
                const selectedCategory = categories.find(c => c.id === field.value);
                return (
                  <FormItem>
                    <FormLabel>Expense Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category">
                            {selectedCategory ? selectedCategory.name : 'Select category'}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}

          {/* @ts-ignore */}
          <FormField
            control={form.control as any}
            name="partyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Party/Reference (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Customer/Supplier name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* @ts-ignore */}
          <FormField
            control={form.control as any}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional notes..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Add Entry"
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
