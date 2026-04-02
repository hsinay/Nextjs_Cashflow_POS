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
import { Textarea } from "@/components/ui/textarea";
import { createDayBookSchema } from "@/lib/validations/daybook.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type CreateDayBookInput = z.infer<typeof createDayBookSchema>;

interface DayBookFormProps {
  onSuccess?: (daybook: any) => void;
  isLoading?: boolean;
}

export function DayBookForm({ onSuccess, isLoading: externalLoading }: DayBookFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateDayBookInput, unknown, CreateDayBookInput>({
    resolver: zodResolver(createDayBookSchema),
    defaultValues: {
      date: new Date(),
      openingCashBalance: 0,
      openingBankBalance: 0,
      notes: "",
    },
  });

  const onSubmit = async (data: CreateDayBookInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/daybook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to open day book");
        return;
      }

      const result = await response.json();
      toast.success("Day book opened successfully");
      
      if (onSuccess) {
        onSuccess(result.data);
      } else {
        router.refresh();
      }

      form.reset();
    } catch (error) {
      console.error("Error opening day book:", error);
      toast.error("An error occurred while opening the day book");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">Open Day Book</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* @ts-ignore */}
          <FormField
            control={form.control as any}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* @ts-ignore */}
          <FormField
            control={form.control as any}
            name="openingCashBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opening Cash Balance</FormLabel>
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
            name="openingBankBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opening Bank Balance</FormLabel>
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
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any notes about the opening..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || externalLoading}
          >
            {isLoading || externalLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening...
              </>
            ) : (
              "Open Day Book"
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
