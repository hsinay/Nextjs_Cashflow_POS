# Purchase Module - Complete API Reference

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints require NextAuth JWT token in httpOnly cookie. Users must be logged in with required roles:

- `ADMIN` - Full access to all endpoints
- `INVENTORY_MANAGER` - Access to inventory/purchase endpoints

---

## Purchase Orders API

### List Purchase Orders

```http
GET /purchase-orders?page=1&limit=10&status=CONFIRMED&supplierId=xxx
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10) |
| status | string | No | Filter by status: DRAFT, CONFIRMED, RECEIVED, CANCELLED |
| supplierId | string | No | Filter by supplier |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "poNumber": "PO-2024-001",
      "supplierId": "clx...",
      "supplierName": "Acme Corp",
      "status": "CONFIRMED",
      "totalAmount": 5000,
      "expectedDeliveryDate": "2024-02-01T00:00:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "items": []
    }
  ]
}
```

---

### Get Purchase Order Details

```http
GET /purchase-orders/{id}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "poNumber": "PO-2024-001",
    "supplierId": "clx...",
    "supplier": {
      "id": "clx...",
      "name": "Acme Corp",
      "email": "supplier@acme.com",
      "balance": 1500,
      "totalPurchases": 25000
    },
    "status": "CONFIRMED",
    "totalAmount": 5000,
    "expectedDeliveryDate": "2024-02-01T00:00:00Z",
    "items": [
      {
        "id": "clx...",
        "productId": "clx...",
        "productName": "Widget A",
        "sku": "WA-001",
        "quantity": 100,
        "unitPrice": 50,
        "totalPrice": 5000,
        "quantityReceived": 80,
        "status": "PARTIAL"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Create Purchase Order

```http
POST /purchase-orders
Content-Type: application/json

{
  "supplierId": "clx...",
  "poNumber": "PO-2024-002",
  "expectedDeliveryDate": "2024-02-15T00:00:00Z",
  "items": [
    {
      "productId": "clx...",
      "quantity": 50,
      "unitPrice": 75
    }
  ],
  "notes": "Expedited delivery requested"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| supplierId | string | Yes | Supplier ID (UUID) |
| poNumber | string | Yes | Unique PO number |
| expectedDeliveryDate | string | No | ISO datetime |
| items | array | Yes | Array of line items |
| notes | string | No | Additional notes |

**Response:** Returns created PO with status 201

```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "poNumber": "PO-2024-002",
    "status": "DRAFT",
    "totalAmount": 3750,
    "items": [...]
  }
}
```

---

### Update Purchase Order

```http
PUT /purchase-orders/{id}
Content-Type: application/json

{
  "expectedDeliveryDate": "2024-02-20T00:00:00Z",
  "notes": "Updated notes"
}
```

**Response:** Returns updated PO

```json
{
  "success": true,
  "data": {...}
}
```

---

### Update Purchase Order Status

```http
PUT /purchase-orders/{id}/status
Content-Type: application/json

{
  "status": "CONFIRMED"
}
```

**Status Transitions:**

- `DRAFT` → `CONFIRMED` - Ready for delivery
- `CONFIRMED` → `RECEIVED` - Goods received (auto via GRN acceptance)
- `CONFIRMED` → `CANCELLED` - Cancel order
- Any → `CANCELLED` - Cancel at any point

**Response:**

```json
{
  "success": true,
  "message": "PO status updated to CONFIRMED"
}
```

---

## Payment Management API

### List Linked Payments

```http
GET /purchase-orders/{id}/payments
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "paymentNumber": "PAY-2024-001",
      "amount": 2000,
      "paymentDate": "2024-01-20T00:00:00Z",
      "status": "PENDING",
      "linkedAt": "2024-01-20T10:00:00Z"
    }
  ]
}
```

---

### Link Payment to PO

```http
POST /purchase-orders/{id}/payments
Content-Type: application/json

{
  "paymentId": "clx...",
  "amount": 2000
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "paymentId": "clx...",
    "amount": 2000,
    "paymentStatus": "PARTIALLY_PAID",
    "balance": 1000
  }
}
```

---

### Unlink Payment from PO

```http
DELETE /purchase-orders/{id}/payments/{paymentId}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment unlinked successfully"
}
```

---

## Goods Received Notes (GRN) API

### Create GRN

```http
POST /purchase-orders/{id}/grn
Content-Type: application/json

{
  "grnDate": "2024-02-01T00:00:00Z",
  "items": [
    {
      "purchaseOrderItemId": "clx...",
      "quantityReceived": 80,
      "quantityInspected": 78,
      "quantityRejected": 2,
      "batchNumber": "BATCH-001",
      "expiryDate": "2025-12-31T00:00:00Z",
      "notes": "2 units damaged in transit"
    }
  ],
  "receivedBy": "John Doe",
  "inspectionNotes": "Quality check passed"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "grnNumber": "GRN-2024-00001",
    "grnDate": "2024-02-01T00:00:00Z",
    "status": "DRAFT",
    "totalQuantityReceived": 80,
    "totalQuantityInspected": 78,
    "totalQuantityRejected": 2,
    "items": [...]
  }
}
```

---

### Get GRN List & Receiving Status

```http
GET /purchase-orders/{id}/grn
GET /purchase-orders/{id}/grn?endpoint=status
```

**Response (List):**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "grnNumber": "GRN-2024-00001",
      "status": "DRAFT",
      "totalQuantityReceived": 80
    }
  ]
}
```

**Response (Status):**

```json
{
  "success": true,
  "data": {
    "purchaseOrderId": "clx...",
    "totalOrdered": 100,
    "totalReceived": 80,
    "totalRejected": 2,
    "pendingReceipt": 20,
    "receivingStatus": "PARTIAL",
    "grnCount": 1
  }
}
```

---

### Accept GRN

```http
POST /grn/{id}/accept
Content-Type: application/json

{
  "acceptedBy": "Jane Smith"
}
```

**Response:**

```json
{
  "success": true,
  "message": "GRN accepted"
}
```

---

## Partial Receipt API

### Create Partial Receipt

```http
POST /purchase-orders/{id}/partial-receipt
Content-Type: application/json

{
  "receiptNumber": "RCP-2024-001",
  "receiptDate": "2024-02-05T00:00:00Z",
  "items": [
    {
      "purchaseOrderItemId": "clx...",
      "quantityReceived": 40,
      "quantityRejected": 0
    }
  ],
  "supplierNotes": "Partial shipment",
  "internalNotes": "First batch received"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "receiptNumber": "RCP-2024-001",
    "status": "RECEIVED"
  }
}
```

---

### Get Partial Receipt Schedule

```http
GET /purchase-orders/{id}/partial-receipt?endpoint=schedule
```

**Response:**

```json
{
  "success": true,
  "data": {
    "purchaseOrderId": "clx...",
    "totalQuantityOrdered": 100,
    "totalQuantityReceived": 80,
    "totalQuantityRejected": 2,
    "percentageReceived": "80.00",
    "receiptCount": 2,
    "items": [
      {
        "poItemId": "clx...",
        "productId": "clx...",
        "quantityOrdered": 100,
        "quantityReceived": 80,
        "quantityRejected": 2,
        "pendingReceipt": 20,
        "percentageReceived": "80.00",
        "status": "PARTIAL",
        "receipts": [
          {
            "receiptNumber": "RCP-2024-001",
            "receiptDate": "2024-02-05T00:00:00Z",
            "quantity": 40,
            "rejected": 0
          }
        ]
      }
    ]
  }
}
```

---

## Supplier Analytics API

### Get Payment Reconciliation Report

```http
GET /suppliers/{id}/reconciliation
GET /suppliers/{id}/reconciliation?startDate=2024-01-01&endDate=2024-12-31
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | ISO date (default: 90 days ago) |
| endDate | string | No | ISO date (default: today) |

**Response:**

```json
{
  "success": true,
  "data": {
    "supplierId": "clx...",
    "supplierName": "Acme Corp",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T00:00:00Z",
    "reconciliationItems": [
      {
        "poNumber": "PO-2024-001",
        "poDate": "2024-01-15T00:00:00Z",
        "poAmount": 5000,
        "matchStatus": "PARTIAL",
        "matchedAmount": 3000,
        "unmatchedAmount": 2000,
        "overpaymentAmount": 0,
        "lastPaymentDate": "2024-02-01T00:00:00Z"
      }
    ],
    "totalPOAmount": 15000,
    "totalMatchedAmount": 12000,
    "totalUnmatchedAmount": 3000,
    "totalOverpaymentAmount": 0,
    "matchPercentage": "80.00"
  }
}
```

---

### Get Supplier Statement

```http
GET /suppliers/{id}/statement?startDate=2024-01-01&endDate=2024-12-31
```

**Response:**

```json
{
  "success": true,
  "data": {
    "supplierId": "clx...",
    "supplierName": "Acme Corp",
    "periodStart": "2024-01-01T00:00:00Z",
    "periodEnd": "2024-12-31T00:00:00Z",
    "openingBalance": 1000,
    "closingBalance": 2500,
    "totalDebits": 15000,
    "totalCredits": 13500,
    "transactions": [
      {
        "date": "2024-01-15T00:00:00Z",
        "type": "PO",
        "reference": "PO-2024-001",
        "amount": 5000,
        "debit": 5000,
        "credit": 0,
        "balance": 6000
      },
      {
        "date": "2024-02-01T00:00:00Z",
        "type": "PAYMENT",
        "reference": "PAY-2024-001",
        "amount": 2000,
        "debit": 0,
        "credit": 2000,
        "balance": 4000
      }
    ]
  }
}
```

---

### Get Supplier Aging

```http
GET /suppliers/{id}/aging
GET /suppliers/{id}/aging?asOfDate=2024-02-15
```

**Response:**

```json
{
  "success": true,
  "data": {
    "supplierId": "clx...",
    "supplierName": "Acme Corp",
    "asOfDate": "2024-02-15T00:00:00Z",
    "totalBalance": 5000,
    "aging": {
      "current": {
        "amount": 2000,
        "percentage": 40,
        "dayRange": "0-30"
      },
      "days31to60": {
        "amount": 1500,
        "percentage": 30,
        "dayRange": "31-60"
      },
      "days61to90": {
        "amount": 1000,
        "percentage": 20,
        "dayRange": "61-90"
      },
      "days90plus": {
        "amount": 500,
        "percentage": 10,
        "dayRange": "90+"
      }
    },
    "unmatchedPOs": [
      {
        "poNumber": "PO-2024-005",
        "poDate": "2024-01-20T00:00:00Z",
        "daysOutstanding": 26,
        "amount": 1500
      }
    ]
  }
}
```

---

## Inventory & Stock Posting API

### Post Stock to Warehouse

```http
POST /inventory/stock-posting
Content-Type: application/json

{
  "referenceId": "clx...",
  "referenceType": "GRN",
  "postingDate": "2024-02-01T00:00:00Z",
  "entries": [
    {
      "productId": "clx...",
      "quantity": 80,
      "unitCost": 50,
      "batchNumber": "BATCH-001",
      "expiryDate": "2025-12-31T00:00:00Z",
      "storageLocation": "SHELF-A1",
      "notes": "Posted to warehouse"
    }
  ],
  "approvedBy": "Warehouse Manager",
  "notes": "GRN stock finalized"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "referenceId": "clx...",
    "referenceType": "GRN",
    "status": "POSTED",
    "items": [...]
  }
}
```

---

### Get Warehouse Stock Summary

```http
GET /inventory/stock-posting?endpoint=warehouse-summary
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalProducts": 150,
    "totalQuantity": 5000,
    "totalValue": 250000,
    "outOfStock": 5,
    "lowStock": 12,
    "products": [
      {
        "productId": "clx...",
        "productName": "Widget A",
        "sku": "WA-001",
        "quantity": 500,
        "reorderLevel": 100,
        "value": 25000,
        "status": "IN_STOCK"
      }
    ]
  }
}
```

---

### Get Product Stock Level

```http
GET /inventory/stock-posting?endpoint=product-level&productId={productId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "productId": "clx...",
    "productName": "Widget A",
    "currentStock": 500,
    "reorderLevel": 100,
    "reorderQuantity": 200,
    "lastPostingDate": "2024-02-01T00:00:00Z",
    "needsReorder": false,
    "transactions": [...],
    "recentPostings": [...]
  }
}
```

---

### Get Stock Movement Report

```http
GET /inventory/stock-posting?endpoint=movement-report&startDate=2024-01-01&endDate=2024-12-31&productId={productId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T00:00:00Z",
    "totalTransactions": 50,
    "byType": [
      {
        "type": "PURCHASE",
        "count": 25,
        "totalQuantity": 2000
      },
      {
        "type": "SALES",
        "count": 15,
        "totalQuantity": 1500
      }
    ],
    "allTransactions": [...]
  }
}
```

---

### Calculate Cost of Goods Sold

```http
GET /inventory/stock-posting?endpoint=cogs&startDate=2024-01-01&endDate=2024-12-31
```

**Response:**

```json
{
  "success": true,
  "data": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T00:00:00Z",
    "totalCOGS": 75000,
    "itemCount": 30,
    "items": [
      {
        "productId": "clx...",
        "productName": "Widget A",
        "quantity": 500,
        "unitCost": 50,
        "totalCost": 25000
      }
    ]
  }
}
```

---

### Validate Stock Levels

```http
GET /inventory/stock-posting?endpoint=validate-levels
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalProducts": 150,
    "belowReorder": 5,
    "overstocked": 3,
    "normal": 142,
    "items": [
      {
        "productId": "clx...",
        "productName": "Widget A",
        "currentStock": 50,
        "reorderLevel": 100,
        "status": "BELOW_REORDER",
        "action": "CREATE_PO"
      }
    ]
  }
}
```

---

## Error Responses

All errors follow standardized format:

```json
{
  "success": false,
  "error": "Error description"
}
```

### Common Error Codes

| Status | Error            | Cause                        |
| ------ | ---------------- | ---------------------------- |
| 400    | Validation error | Invalid input fields         |
| 401    | Unauthorized     | Not logged in                |
| 403    | Forbidden        | Insufficient permissions     |
| 404    | Not found        | Resource doesn't exist       |
| 500    | Server error     | Database or processing error |

---

## Rate Limiting

No rate limiting implemented. Recommended for production: 100 requests/minute per user.

---

## Pagination

List endpoints support pagination:

- `page` - Page number (1-based)
- `limit` - Items per page (default: 10, max: 100)

Example:

```
GET /purchase-orders?page=2&limit=20
```

---

## Filtering & Sorting

Purchase order list supports:

- `status` - Filter by PO status
- `supplierId` - Filter by supplier
- `sortBy` - Sort field (createdAt, totalAmount, status)
- `sortOrder` - asc or desc

---

## Webhook Endpoints (Future)

Planned webhook events:

- `po.created` - When PO created
- `payment.linked` - When payment linked
- `grn.accepted` - When GRN accepted
- `stock.posted` - When stock posted

---

**API Version:** 1.0  
**Last Updated:** 2024  
**Status:** Production Ready
