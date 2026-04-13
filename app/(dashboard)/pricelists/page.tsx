import { PricelistList } from '@/components/pricelists/pricelist-list';
import { H1, Small } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth';
import { Colors, Spacing } from '@/lib/design-tokens';
import { getAllPricelistsSummary } from '@/services/pricelist.service';
import { Plus } from 'lucide-react';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function PricelistsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check permissions
  const hasPermission =
    session.user.roles.includes('ADMIN') ||
    session.user.roles.includes('INVENTORY_MANAGER');

  if (!hasPermission) {
    redirect('/dashboard');
  }

  let pricelists = [];
  let error = null;

  try {
    console.log('Fetching pricelists...');
    pricelists = await getAllPricelistsSummary();
    console.log('Pricelists fetched successfully:', pricelists.length, 'items');
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to fetch pricelists';
    console.error('Error fetching pricelists:', err);
  }

  return (
    <div style={{ backgroundColor: Colors.gray[50], minHeight: '100vh', padding: Spacing.lg }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl }}>
          <div>
            <H1>Pricelists</H1>
            <Small color={Colors.text.secondary} className="mt-2">
              Manage product pricing rules and discounts
            </Small>
          </div>
          <Link href="/dashboard/pricelists/new">
            <Button
              style={{
                backgroundColor: Colors.primary.start,
                color: '#ffffff',
                gap: Spacing.sm,
              }}
            >
              <Plus className="w-4 h-4" />
              New Pricelist
            </Button>
          </Link>
        </div>

        {/* Pricelist List Component */}
        <PricelistList pricelists={pricelists} error={error} />
      </div>
    </div>
  );
}
