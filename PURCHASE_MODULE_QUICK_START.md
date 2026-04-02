# Purchase Module - Quick Start Guide

## What Was Built?

A complete **Purchase-to-Pay** workflow system for the POS/ERP platform with 4 integrated modules:

1. **Purchase Orders** - Create and track supplier orders
2. **Payment Management** - Link payments and track balances
3. **Accounting Integration** - Reconcile payments and analyze aging
4. **Inventory Management** - Receive goods, track shipments, post stock

---

## Quick Links

- 📋 **Complete Delivery Report:** `PURCHASE_MODULE_COMPLETE_DELIVERY.md`
- 🔌 **API Reference:** `PURCHASE_MODULE_API_REFERENCE.md`
- 📊 **Implementation Summary:** `PURCHASE_MODULE_IMPLEMENTATION_SUMMARY.md`

---

## Start Using It

### 1. Login to Dashboard

```
URL: http://localhost:3000/login
Username: admin
```

### 2. Create Purchase Order

1. Go to `/dashboard/purchase-orders`
2. Click "New Purchase Order"
3. Select supplier, add items, set delivery date
4. Save as DRAFT, then CONFIRM

### 3. Link Payment

1. Open PO details
2. Go to "Payments" section
3. Click "Link Payment"
4. Select payment, enter amount
5. Payment status updates automatically (PENDING → PARTIALLY_PAID → FULLY_PAID)

### 4. Receive Goods

1. Open PO details
2. Go to "Goods Receipt" section
3. Create GRN (Goods Received Note)
4. Enter received quantities, batch numbers, expiry dates
5. Accept GRN to post to inventory

### 5. View Supplier Statements

1. Go to `/dashboard/suppliers`
2. Select supplier
3. View:
   - Reconciliation report (unmatched POs)
   - Aging analysis (0-30, 31-60, 61-90, 90+ days)
   - Statement (transaction history with running balance)

### 6. Manage Inventory

1. Go to `/dashboard/inventory`
2. View warehouse stock summary
3. Check reorder alerts
4. View stock movement reports

---

## API Quick Reference

### Create Purchase Order

```bash
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "supplier-id",
    "poNumber": "PO-2024-001",
    "items": [
      {"productId": "product-id", "quantity": 100, "unitPrice": 50}
    ]
  }'
```

### Link Payment

```bash
curl -X POST http://localhost:3000/api/purchase-orders/{id}/payments \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "payment-id",
    "amount": 5000
  }'
```

### Create GRN

```bash
curl -X POST http://localhost:3000/api/purchase-orders/{id}/grn \
  -H "Content-Type: application/json" \
  -d '{
    "grnDate": "2024-02-01T00:00:00Z",
    "items": [
      {
        "purchaseOrderItemId": "item-id",
        "quantityReceived": 80,
        "batchNumber": "BATCH-001"
      }
    ],
    "receivedBy": "John Doe"
  }'
```

### Get Supplier Aging

```bash
curl http://localhost:3000/api/suppliers/{id}/aging
```

### View Warehouse Summary

```bash
curl "http://localhost:3000/api/inventory/stock-posting?endpoint=warehouse-summary"
```

---

## Key Features

### ✅ Phase 1: Purchase Orders

- Auto-numbered POs (PO-YYYY-##### format)
- Multiple items per order
- Status tracking (DRAFT → CONFIRMED → RECEIVED)
- Supplier integration

### ✅ Phase 2: Payment Tracking

- Link multiple payments to one PO
- Automatic payment status calculation
  - PENDING: No payments
  - PARTIALLY_PAID: Partial payment
  - FULLY_PAID: Total paid equals PO amount
  - OVERPAID: More than PO amount
- Supplier balance auto-updates
- GL entries for audit trail

### ✅ Phase 3: Accounting

- Payment reconciliation (match payments to POs)
- Supplier aging analysis
  - 0-30 days current
  - 31-60 days overdue
  - 61-90 days overdue
  - 90+ days overdue
- Supplier statements with transaction history
- Running balance calculations

### ✅ Phase 4: Inventory

- GRN (Goods Received Notes) with auto-numbering
- Batch tracking with expiry dates
- Partial receipt support (multiple shipments)
- Delivery variance analysis (on-time tracking)
- Stock posting to finalize inventory
- Warehouse stock summary
- COGS (Cost of Goods Sold) calculation
- Stock reorder alerts

---

## Database Operations

### Key Tables

| Table             | Purpose                         |
| ----------------- | ------------------------------- |
| PurchaseOrder     | Master PO records               |
| PurchaseOrderItem | Line items                      |
| Payment           | Payment records (linked to POs) |
| GoodsReceivedNote | GRN tracking                    |
| PartialReceipt    | Partial shipments               |
| StockPosting      | Warehouse finalization          |
| LedgerEntry       | GL audit trail                  |
| Supplier          | Supplier master with balances   |
| Product           | Inventory with stock levels     |

### Example Queries

```sql
-- Get outstanding supplier balance
SELECT SUM(totalAmount) - COALESCE(SUM(paidAmount), 0) as balance
FROM PurchaseOrder
WHERE supplierId = 'supplier-id' AND status != 'CANCELLED'

-- Get unmatched GRNs
SELECT * FROM GoodsReceivedNote
WHERE status = 'DRAFT' AND createdAt < NOW() - INTERVAL 7 DAY

-- Get inventory value
SELECT SUM(stockQuantity * unitPrice) as totalValue
FROM Product
```

---

## Workflow Examples

### Complete Purchase-to-Pay Cycle

1. **Create PO** (DRAFT)

   ```
   POST /api/purchase-orders
   → Status: DRAFT
   ```

2. **Confirm Order** (CONFIRMED)

   ```
   PUT /api/purchase-orders/{id}/status
   {status: "CONFIRMED"}
   ```

3. **Supplier Ships Goods**

   - 1st Shipment: 40 units
   - 2nd Shipment: 40 units (total 80 of 100)

4. **Receive 1st Shipment** (Partial)

   ```
   POST /api/purchase-orders/{id}/partial-receipt
   → 40 units received
   → PO status: PARTIALLY_RECEIVED
   ```

5. **Receive 2nd Shipment**

   ```
   POST /api/purchase-orders/{id}/partial-receipt
   → 40 units received
   → PO status: PARTIALLY_RECEIVED (80/100)
   ```

6. **Create GRN** (For final 20 units)

   ```
   POST /api/purchase-orders/{id}/grn
   → 20 units received
   → Total received: 100
   ```

7. **Accept GRN**

   ```
   POST /api/grn/{id}/accept
   → PO status: RECEIVED
   → Goods in warehouse
   ```

8. **Post Stock**

   ```
   POST /api/inventory/stock-posting
   → Stock finalized
   → GL entries created
   ```

9. **Supplier Invoices** → $5000

10. **Link Payment** → $3000

    ```
    POST /api/purchase-orders/{id}/payments
    → Status: PARTIALLY_PAID ($3000 of $5000)
    ```

11. **Link Second Payment** → $2000

    ```
    POST /api/purchase-orders/{id}/payments
    → Status: FULLY_PAID (Total: $5000)
    ```

12. **Check Supplier Statement**
    ```
    GET /api/suppliers/{id}/statement
    → Shows all transactions
    → Running balance: $0 (paid in full)
    ```

---

## Common Tasks

### How to...

**Create a Purchase Order**

1. `/dashboard/purchase-orders` → New PO
2. Select supplier, add items
3. Enter delivery date
4. Save & Confirm

**Link a Payment**

1. Open PO → Payments tab
2. Click "Link Payment"
3. Select payment from dropdown
4. Enter amount, confirm
5. Status updates automatically

**Receive Goods**

1. Open PO → Goods Receipt tab
2. Create GRN (or Partial Receipt)
3. Enter quantities, batch numbers
4. Accept to finalize

**View Aging Report**

1. Go to `/dashboard/suppliers`
2. Select supplier
3. Click "Aging Analysis"
4. See breakdown by age buckets

**Get Supplier Statement**

1. Open supplier details
2. Click "Statement"
3. Select date range
4. View transaction history

**Check Inventory**

1. `/dashboard/inventory` → Summary
2. See total stock, value, low stock alerts
3. Click product for details
4. View stock movement history

---

## Troubleshooting

| Problem                   | Solution                                     |
| ------------------------- | -------------------------------------------- |
| Can't create PO           | Login first, check supplier exists           |
| Payment not linking       | Ensure payment amount is available in system |
| GRN creation fails        | PO must be CONFIRMED status                  |
| Stock not updating        | Run Stock Posting after GRN                  |
| Aging shows wrong balance | Verify all payments linked to PO             |
| GL entries missing        | Check transaction completed successfully     |

---

## Architecture at a Glance

```
Dashboard (UI)
    ↓
API Routes (/api/purchase-orders, /api/suppliers, etc)
    ↓
Service Layer (business logic)
    ↓
Prisma ORM
    ↓
PostgreSQL Database
    ↓
GL Entries (audit trail)
```

### Data Flow Example

```
Create PO
  ↓
Service validates input
  ↓
Create PurchaseOrder record
  ↓
Create PurchaseOrderItems
  ↓
Create GL entry (AP credit)
  ↓
Return to UI with PO details
```

---

## Performance Tips

1. **For Large PO Lists:** Use filters (status, supplier)
2. **For Aging Reports:** Use date ranges to limit data
3. **For Stock Queries:** Query by product, not full warehouse
4. **For GL Reports:** Filter by date range
5. **Batch Operations:** Use partial receipts to avoid large GRNs

---

## Security Notes

- ✅ All endpoints require login
- ✅ ADMIN or INVENTORY_MANAGER role needed
- ✅ All inputs validated with Zod
- ✅ GL entries create audit trail
- ✅ No sensitive data in responses
- ✅ Session tokens in httpOnly cookies

---

## Files to Review

| File                                         | Purpose                          |
| -------------------------------------------- | -------------------------------- |
| `services/purchase-order.service.ts`         | Core PO logic (Phase 1-2)        |
| `services/payment-reconciliation.service.ts` | Aging/reconciliation (Phase 3)   |
| `services/grn.service.ts`                    | Goods receipt (Phase 4)          |
| `services/partial-receipt.service.ts`        | Partial shipments (Phase 4)      |
| `services/stock-posting.service.ts`          | Inventory finalization (Phase 4) |
| `app/api/purchase-orders/route.ts`           | PO API endpoints                 |
| `app/api/suppliers/[id]/aging/route.ts`      | Aging analysis endpoint          |
| `lib/validations/purchase-order.schema.ts`   | Input validation schemas         |

---

## Next Steps

1. ✅ Deploy to production
2. ✅ Train users on workflows
3. ✅ Set up supplier accounts
4. ✅ Migrate historical data (optional)
5. ✅ Run test transactions
6. ✅ Monitor GL entries
7. ✅ Review aging reports regularly
8. ✅ Optimize stock levels

---

## Support

For detailed information:

- 📋 API Endpoints → See `PURCHASE_MODULE_API_REFERENCE.md`
- 📊 Architecture → See `PURCHASE_MODULE_COMPLETE_DELIVERY.md`
- 💻 Code Details → See `PURCHASE_MODULE_IMPLEMENTATION_SUMMARY.md`

---

**Module Status:** ✅ COMPLETE & READY FOR PRODUCTION

All 4 phases implemented, tested, and documented.  
Ready for immediate use and deployment.
