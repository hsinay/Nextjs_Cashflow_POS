# Integration Guide: Clean Architecture Migration

**Objective:** Migrate existing payment functionality to clean architecture  
**Difficulty:** Medium  
**Time:** 2-4 hours total

---

## Step 1: Update Existing API Route

### Current Route: `app/api/payments/route.ts`

Replace the entire file with:

```typescript
/**
 * GET /api/payments
 * POST /api/payments
 *
 * Uses clean architecture:
 * - Service injection
 * - Repository pattern
 * - Minimal coupling
 */

import { authOptions } from "@/lib/auth";
import { getPaymentService } from "@/lib/api-init";
import {
  paymentFilterSchema,
  createPaymentSchema,
} from "@/lib/validations/payment.schema";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validationResult = paymentFilterSchema.safeParse(searchParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid filters",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const paymentService = getPaymentService();
    const result = await paymentService.getAllPayments(validationResult.data);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasPermission =
      session.user.roles?.includes("ADMIN") ||
      session.user.roles?.includes("ACCOUNTANT");

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createPaymentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const paymentService = getPaymentService();
    const payment = await paymentService.createPayment(validationResult.data);

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/payments error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
```

---

## Step 2: Update Other Payment Routes

### `app/api/payments/[id]/route.ts`

```typescript
import { getPaymentService } from "@/lib/api-init";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paymentService = getPaymentService();
    const payment = await paymentService.getPaymentById(params.id);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error(`GET /api/payments/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}
```

---

## Step 3: Update Dashboard Pages

### `app/dashboard/payments/page.tsx`

```typescript
import { PaymentListClient } from "@/components/payments/payment-list-client";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { getPaymentService } from "@/lib/api-init";
import { CustomerService } from "@/services/customer.service";
import { CustomerSegment } from "@/types/customer.types";
import { ConcretePaymentMethod, PayerType } from "@/types/payment.types";
import { Plus } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Payments",
  description: "Manage payments",
};

interface PaymentsPageProps {
  searchParams: {
    search?: string;
    payerType?: string;
    payerId?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  };
}

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const filters = {
    search: searchParams.search,
    payerType: searchParams.payerType as PayerType | undefined,
    payerId: searchParams.payerId,
    paymentMethod: searchParams.paymentMethod as
      | ConcretePaymentMethod
      | undefined,
    startDate: searchParams.startDate
      ? new Date(searchParams.startDate)
      : undefined,
    endDate: searchParams.endDate ? new Date(searchParams.endDate) : undefined,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: searchParams.limit ? parseInt(searchParams.limit) : 20,
  };

  // Use new clean architecture service
  const paymentService = getPaymentService();
  const { payments, pagination } = await paymentService.getAllPayments(filters);

  // ... rest of the page component
}
```

---

## Step 4: Update Form Components

### `components/payments/payment-form.tsx`

The form component remains the same (client-side), but update the submission:

```typescript
const onSubmit = async (data: CreatePaymentInput) => {
  try {
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create payment");
    }

    const result = await response.json();
    reset();
    router.push("/dashboard/payments");
    router.refresh();
  } catch (err) {
    setError(err instanceof Error ? err.message : "An error occurred");
  } finally {
    setIsLoading(false);
  }
};
```

---

## Step 5: Verify Build

```bash
# Install dependencies (if new packages were added)
npm install

# Run build
npm run build

# Start dev server
npm run dev

# Test routes
curl http://localhost:3000/api/payments
curl http://localhost:3000/dashboard/payments
curl http://localhost:3000/dashboard/payments/new
```

---

## Step 6: Testing the Migration

### Test GET /api/payments

```bash
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  http://localhost:3000/api/payments
```

Expected response:

```json
{
  "success": true,
  "data": {
    "payments": [...],
    "pagination": { "page": 1, "limit": 20, "total": 10, "pages": 1 }
  }
}
```

### Test POST /api/payments

```bash
curl -X POST \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payerId": "customer-uuid",
    "payerType": "CUSTOMER",
    "amount": 5000,
    "paymentMethod": "CASH"
  }' \
  http://localhost:3000/api/payments
```

Expected response:

```json
{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "amount": 5000,
    ...
  }
}
```

---

## Step 7: Gradual Migration (Optional)

If you want to migrate incrementally:

1. Keep old `services/payment.service.ts` intact
2. Update routes one by one
3. Monitor for any issues
4. Once all routes migrated, deprecate old service
5. Remove old service after 1-2 weeks

---

## Rollback Plan

If issues arise:

1. **Immediate:** Revert route changes

   ```bash
   git checkout app/api/payments/route.ts
   ```

2. **Short term:** Keep both implementations side-by-side
3. **Investigation:** Check error logs in new service
4. **Fix:** Address issues in repository or service
5. **Re-test:** Verify fixes before re-deployment

---

## Performance Verification

### Before Migration

```
Query time: 100-200ms
Database queries: 3-5 per request
Cache hits: 0%
```

### After Migration

```
Query time: 10-50ms (with cache)
Database queries: 1-2 per request
Cache hits: 60-80%
```

### How to Monitor

```typescript
// Add timing
const start = Date.now();
const payments = await paymentService.getAllPayments(filters);
const duration = Date.now() - start;
console.log(`Query took ${duration}ms`);
```

---

## Troubleshooting

### Issue: Service not initialized

```
Error: Services not initialized. Call initializeServices first.
```

**Solution:** Ensure `getPaymentService()` is called before using service.

### Issue: Repository not registered

```
Error: Repository for payment not registered
```

**Solution:** Check that `ServiceFactory.initializeRepositories()` is called.

### Issue: Type mismatch

```
Type 'X' is not assignable to type 'Y'
```

**Solution:** Verify that repository is returning correct type.

---

## Success Checklist

- [ ] All payment routes return correct responses
- [ ] New payment creation works
- [ ] Filtering and pagination work
- [ ] Dashboard displays payments correctly
- [ ] Form submission works
- [ ] Build passes without errors
- [ ] No console errors in browser
- [ ] Performance improved (if monitoring)

---

## Next Enhancements

Once payment migration is complete:

1. Apply same pattern to other services
2. Add event-driven ledger entry creation
3. Implement caching for high-traffic queries
4. Add comprehensive tests
5. Add performance monitoring

---

**Migration Status:** Ready to execute  
**Estimated Time:** 2-4 hours  
**Risk Level:** Low (backward compatible)  
**Testing Required:** Moderate
