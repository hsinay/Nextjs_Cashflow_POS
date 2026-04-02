# Order Payment Feature - Technical Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer                                  │
├─────────────────────────────────────────────────────────────┤
│ OrderPaymentDialog → OrderPaymentForm → API Call           │
│ OrderPaymentHistory → Delete Payment → API Call             │
│ CustomerOrdersPage → Integrated Payment Management           │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                    API Layer                                  │
├─────────────────────────────────────────────────────────────┤
│ POST   /api/orders/[id]/payments        Create payment      │
│ GET    /api/orders/[id]/payments        List payments       │
│ DELETE /api/orders/[id]/payments/[pid]  Delete payment      │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                Service Layer                                  │
├─────────────────────────────────────────────────────────────┤
│ order-payment.service.ts                                    │
│  - createOrderPayment()                                      │
│  - getOrderPayments()                                        │
│  - deleteOrderPayment()                                      │
│  - getOrderPaymentSummary()                                  │
│  - getCustomerPaymentStats()                                 │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                Database Layer (Prisma)                        │
├─────────────────────────────────────────────────────────────┤
│ SalesOrder       (updated: paidAmount, paymentStatus)      │
│ OrderPayment     (new model)                                │
│ Customer         (updated: orderPayments relation)          │
│ DayBook          (auto entry creation)                      │
│ DayBookEntry     (auto CASH_RECEIPT entries)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Payment Creation Flow

```
User Input (PaymentForm)
        ↓
Zod Validation (order-payment.schema)
        ↓
POST /api/orders/[id]/payments
        ↓
✓ Get SalesOrder & validate
✓ Check amount ≤ balance
✓ Create OrderPayment record
        ↓
Update SalesOrder:
  - paidAmount += payment.amount
  - Check if fully paid
  - Update paymentStatus (UNPAID → PARTIALLY_PAID → PAID)
  - Update balanceAmount
        ↓
Create DayBookEntry:
  - Type: CASH_RECEIPT
  - Date: paymentDate
  - Amount: payment.amount
  - Reference: payment.id
        ↓
Return Payment + Summary
        ↓
UI Refresh (OrderPaymentHistory)
```

---

## File Structure

```
/components/customers/
  ├── order-payment-dialog.tsx        # Dialog wrapper
  ├── order-payment-form.tsx          # Form component
  ├── order-payment-history.tsx       # History table

/lib/validations/
  └── order-payment.schema.ts         # Zod validation

/services/
  └── order-payment.service.ts        # Business logic

/app/api/orders/[id]/payments/
  ├── route.ts                        # GET, POST endpoints
  └── [paymentId]/route.ts            # DELETE endpoint

/types/
  └── sales-order.types.ts            # Updated with payment types

/prisma/
  └── schema.prisma                   # Database definitions

/app/dashboard/customers/[id]/orders/
  └── page.tsx                        # Updated to use new features
```

---

## Database Schema

### OrderPayment Model

```prisma
model OrderPayment {
  id               String        @id @default(uuid())
  salesOrderId     String        // FK to SalesOrder
  customerId       String        // FK to Customer
  amount           Decimal       @db.Decimal(12, 2)
  paymentDate      DateTime      @default(now())
  paymentMethod    PaymentMethod // ENUM
  referenceNumber  String?       // Transaction ID, check number, etc.
  notes            String?       // Payment notes
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  // Relations
  salesOrder SalesOrder @relation(fields: [salesOrderId], references: [id], onDelete: Cascade)
  customer   Customer   @relation("CustomerOrderPayments", fields: [customerId], references: [id], onDelete: Cascade)

  // Indexes for performance
  @@index([salesOrderId])
  @@index([customerId])
  @@index([paymentDate])
  @@map("order_payments")
}
```

### SalesOrder Updates

```prisma
model SalesOrder {
  // ... existing fields ...
  paidAmount          Decimal          @default(0) @db.Decimal(12, 2)
  paymentStatus       SalesOrderPaymentStatus @default(UNPAID)

  // New relation
  payments OrderPayment[]

  // New index
  @@index([paymentStatus])
}
```

### Enum Definitions

```prisma
enum PaymentMethod {
  CASH
  BANK_TRANSFER
  CARD
  UPI
  CHEQUE
  DIGITAL_WALLET
  CREDIT
  DEBIT
  MOBILE_WALLET
}

enum SalesOrderPaymentStatus {
  UNPAID
  PARTIALLY_PAID
  PAID
}
```

---

## Service Layer Details

### Order Payment Service Functions

#### createOrderPayment(input: CreateOrderPaymentInput)

- **Purpose**: Create payment and update order status
- **Inputs**:
  - salesOrderId, amount, paymentDate, paymentMethod, referenceNumber, notes
- **Process**:
  1. Validate order exists
  2. Check amount doesn't exceed balance
  3. Create OrderPayment record
  4. Update SalesOrder (paidAmount, paymentStatus)
  5. Create DayBookEntry (CASH_RECEIPT)
- **Returns**: Payment object with order included
- **Errors**: Throws if order not found or amount > balance

#### getOrderPayments(salesOrderId: string)

- **Purpose**: Get all payments for an order
- **Returns**: Array of payment objects with related data
- **Used by**: OrderPaymentHistory component

#### getOrderPaymentSummary(salesOrderId: string)

- **Purpose**: Get payment summary for an order
- **Returns**:
  ```typescript
  {
    orderId: string,
    totalAmount: number,
    paidAmount: number,
    balanceAmount: number,
    paymentStatus: string,
    paymentCount: number,
    payments: Payment[]
  }
  ```

#### deleteOrderPayment(paymentId: string)

- **Purpose**: Delete payment (admin only)
- **Process**:
  1. Get payment + order details
  2. Recalculate paidAmount
  3. Update order status
  4. Delete DayBookEntry
  5. Delete payment record
- **Returns**: Confirmation
- **Access**: Admin role required

#### getCustomerPaymentStats(customerId: string)

- **Purpose**: Get payment statistics for customer
- **Returns**:
  ```typescript
  {
    totalOrders: number,
    totalOrderValue: number,
    totalPaidAmount: number,
    totalOutstanding: number,
    paidOrders: number,
    partiallyPaidOrders: number,
    unpaidOrders: number
  }
  ```

---

## API Endpoints

### GET /api/orders/[id]/payments

**Purpose**: Retrieve payments for an order

**Auth**: Required (all authenticated users)

**Response**:

```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "uuid",
        "amount": 500,
        "paymentDate": "2026-01-15T10:30:00Z",
        "paymentMethod": "CASH",
        "referenceNumber": "CHK-123",
        "notes": "Customer check payment"
      }
    ],
    "summary": {
      "orderId": "uuid",
      "totalAmount": 1000,
      "paidAmount": 500,
      "balanceAmount": 500,
      "paymentStatus": "PARTIALLY_PAID",
      "paymentCount": 1
    }
  }
}
```

### POST /api/orders/[id]/payments

**Purpose**: Create a new payment

**Auth**: Required (all authenticated users)

**Request Body**:

```json
{
  "amount": 500,
  "paymentDate": "2026-01-15",
  "paymentMethod": "CASH",
  "referenceNumber": "optional",
  "notes": "optional"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "salesOrderId": "uuid",
    "customerId": "uuid",
    "amount": 500,
    "paymentDate": "2026-01-15T00:00:00Z",
    "paymentMethod": "CASH",
    "referenceNumber": "optional",
    "notes": "optional",
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

### DELETE /api/orders/[id]/payments/[paymentId]

**Purpose**: Delete a payment record

**Auth**: Required, ADMIN role only

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Payment deleted successfully"
}
```

---

## Validation Schema

### CreateOrderPaymentInput

```typescript
{
  salesOrderId: string (UUID, required)
  amount: number (> 0, <= remaining balance, required)
  paymentDate: Date (required, defaults to now())
  paymentMethod: enum (CASH | BANK_TRANSFER | CARD | UPI | CHEQUE | DIGITAL_WALLET | CREDIT | DEBIT | MOBILE_WALLET, required)
  referenceNumber?: string (optional)
  notes?: string (optional)
}
```

---

## UI Component Architecture

### OrderPaymentDialog

- **Type**: Client component
- **Props**:
  - orderId, customerId
  - totalAmount, paidAmount, balanceAmount
  - paymentStatus
  - onPaymentSuccess callback
  - disabled flag
- **State**: Dialog open/closed state
- **Child**: OrderPaymentForm

### OrderPaymentForm

- **Type**: Client component
- **Library**: react-hook-form + Zod validation
- **Fields**:
  - Amount (number input with max validation)
  - Payment Date (date input)
  - Payment Method (select dropdown)
  - Reference Number (text input)
  - Notes (textarea)
- **Features**:
  - Real-time validation
  - Max amount indicator
  - Order summary display
  - Loading state during submission
  - Error message display

### OrderPaymentHistory

- **Type**: Client component
- **Props**:
  - payments array
  - orderId
  - onPaymentDeleted callback
  - canDelete bool (admin check)
- **Features**:
  - Table display of payments
  - Delete button per row (conditionally shown)
  - Payment formatting (date, amount, method)
  - Empty state message

---

## Cashflow Integration

### Automatic DayBook Entry Creation

When a payment is recorded:

```typescript
await prisma.dayBookEntry.create({
  data: {
    dayBookId: dayBook.id,
    entryType: "CASH_RECEIPT",
    entryDate: new Date(input.paymentDate),
    description: `Payment received from customer ${order.customer.name} for order ${order.id.slice(0, 8)}`,
    amount: new Prisma.Decimal(input.amount),
    paymentMethod: input.paymentMethod,
    referenceType: "SALES_ORDER_PAYMENT",
    referenceId: payment.id,
    partyType: "CUSTOMER",
    partyId: order.customerId,
    partyName: order.customer.name,
    debitAccount: "CASH",
    creditAccount: "SALES_REVENUE",
    createdById: "system",
  },
});
```

### DayBook Query for Daily Reconciliation

```typescript
// Get all payment entries for a day
const paymentEntries = await prisma.dayBookEntry.findMany({
  where: {
    dayBook: { date: targetDate },
    referenceType: "SALES_ORDER_PAYMENT",
  },
});

// Sum all payment amounts
const totalPayments = paymentEntries.reduce(
  (sum, entry) => sum + entry.amount.toNumber(),
  0,
);
```

---

## Error Handling

### ValidationError

- Thrown when Zod validation fails
- Returns 400 Bad Request with error details
- Example: Amount > remaining balance

### NotFoundError

- Thrown when order or payment not found
- Returns 404 Not Found

### AuthorizationError

- Thrown when user lacks required role
- Returns 403 Forbidden
- Only ADMIN can delete payments

### BusinessLogicError

- Thrown for payment-specific errors
- Returns 500 Internal Server Error
- Examples: Failed to update order, failed to create DayBook

---

## Performance Considerations

### Indexes

```prisma
@@index([salesOrderId])  // Query payments by order
@@index([customerId])    // Query payments by customer
@@index([paymentDate])   // Filter by date range
```

### Query Optimization

- Use `include` only when needed
- Paginate customer payment lists
- Cache payment summaries if frequently accessed

### DayBook Auto-Creation

- Gets or creates DayBook for current date only
- Prevents duplicate DayBook records per date
- Uses index on `date` for fast lookup

---

## Testing Checklist

- [ ] Payment created with valid inputs
- [ ] Order status updates correctly (UNPAID → PARTIALLY_PAID → PAID)
- [ ] Payment amount validates against balance
- [ ] DayBook entry created when payment recorded
- [ ] Payment history displays correctly
- [ ] Payment can be deleted by admin
- [ ] Payment deletion reverses order status
- [ ] API returns proper error messages
- [ ] Form shows max amount correctly
- [ ] UI refreshes after payment success

---

## Security Considerations

- ✓ Payment creation requires authentication
- ✓ Payment deletion requires ADMIN role
- ✓ Zod validation prevents invalid inputs
- ✓ Reference numbers stored as plain text (consider encryption for sensitive data)
- ✓ No exposure of payment method in logs
- ✓ DayBook entries created with system user for audit trail

---

## Future Enhancements

- [ ] Payment refunds support
- [ ] Split payments (pay from multiple customers in one transaction)
- [ ] Payment reconciliation with bank statements
- [ ] Automated payment reminders
- [ ] Payment failure tracking and retry logic
- [ ] Multi-currency support
- [ ] Payment receipts generation and email
- [ ] Bulk payment import/export

---

## Support & Maintenance

For issues or questions:

1. Check DayBook entries are created correctly
2. Verify SalesOrder totals match sum of payments
3. Check for orphaned payments (unmatched entries)
4. Validate customer credit system integration if used

---

## Version History

| Version | Date | Changes                |
| ------- | ---- | ---------------------- |
| 1.0     | 2026 | Initial implementation |

---
