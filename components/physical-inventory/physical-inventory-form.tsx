'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createPhysicalInventorySchema } from '@/lib/validations/physical-inventory.schema';
import { CountMethod, Location } from '@/types/physical-inventory.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface PhysicalInventoryFormProps {
  isEditing?: boolean;
}

export function PhysicalInventoryForm({
  isEditing = false,
}: PhysicalInventoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  const form = useForm({
    resolver: zodResolver(createPhysicalInventorySchema),
    defaultValues: {
      locationId: '',
      countDate: new Date().toISOString().split('T')[0],
      countMethod: 'FULL_COUNT' as CountMethod,
      notes: '',
    },
  });

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch('/api/locations');
        if (!res.ok) throw new Error('Failed to fetch locations');
        const data = await res.json();
        setLocations(data.data || []);
      } catch (err) {
        console.error('Error fetching locations:', err);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  const onSubmit = async (data: any) => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/physical-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create physical inventory');
      }

      const result = await res.json();
      router.push(`/dashboard/inventory/physical-inventory/${result.data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Location Selection */}
          <FormField
            control={form.control}
            name="locationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loadingLocations}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location where you'll count inventory" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the warehouse or section you're counting
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Count Date */}
          <FormField
            control={form.control}
            name="countDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Count Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>
                  Date when the physical count takes place
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Count Method */}
          <FormField
            control={form.control}
            name="countMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Count Method *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FULL_COUNT">
                      Full Count - Count all products in location
                    </SelectItem>
                    <SelectItem value="PARTIAL_COUNT">
                      Partial Count - Count selected products only
                    </SelectItem>
                    <SelectItem value="CYCLE_COUNT">
                      Cycle Count - Continuous rolling count
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose how you'll conduct the inventory count
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any special instructions or notes for this count session..."
                    className="h-20"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional: Add any relevant information
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Count Session
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
