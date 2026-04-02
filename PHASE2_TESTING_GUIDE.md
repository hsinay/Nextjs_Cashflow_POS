# Phase 2 Testing Guide - Physical Inventory API

## Quick Start Testing

### Prerequisites

✓ Dev server running (`npm run dev`)  
✓ PostgreSQL database ready  
✓ 5 locations seeded (Phase 1)  
✓ Test users available

### Test User Credentials

```
Username: admin
Password: admin123

Username: inventory_manager
Password: inventory123
```

---

## Test Scenario 1: Create & Count Full Workflow

### Step 1: Login to get session token

The browser handles this automatically via NextAuth. First, open the app in browser:

```
http://localhost:3000/login
```

Login as `admin` / `admin123`

### Step 2: Create Physical Inventory Session

**Endpoint:** POST /api/physical-inventory  
**Authorization:** NextAuth cookie (automatic in browser)

Using curl:

```bash
curl -X POST http://localhost:3000/api/physical-inventory \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "locationId": "LOCATION_UUID_HERE",
    "countDate": "2026-04-02",
    "countMethod": "FULL_COUNT",
    "notes": "Full stocktake WH-001"
  }'
```

**Using Postman:**

1. Set request to POST
2. URL: `http://localhost:3000/api/physical-inventory`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):

```json
{
  "locationId": "550e8400-e29b-41d4-a716-446655440001",
  "countDate": "2026-04-02",
  "countMethod": "FULL_COUNT",
  "notes": "Full count session"
}
```

5. Auth: Inherit from environment (or add session cookie manually)

**Expected Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "pi-uuid-here",
    "referenceNumber": "PI-WH-001-20260402-001",
    "status": "DRAFT",
    "locationId": "550e8400-e29b-41d4-a716-446655440001",
    "countDate": "2026-04-02",
    "countMethod": "FULL_COUNT",
    "lines": [
      { "productId": "...", "systemQuantity": 100, "variance": null },
      { "productId": "...", "systemQuantity": 50, "variance": null }
    ],
    "createdAt": "2026-04-02T12:00:00Z"
  }
}
```

**Copy the `id` from response** - you'll need it for next steps.

---

### Step 3: Add Count Lines

**Endpoint:** POST /api/physical-inventory/[id]/lines  
**Path:** Replace `[id]` with the UUID from Step 2

Using curl:

```bash
PI_ID="YOUR_PI_ID_FROM_STEP_2"
curl -X POST "http://localhost:3000/api/physical-inventory/$PI_ID/lines" \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "productId": "PRODUCT_UUID_HERE",
    "physicalQuantity": 95,
    "batchNumber": "BATCH-2024-001",
    "notes": "Verified by admin"
  }'
```

**Using Postman:**

1. Set request to POST
2. URL: `http://localhost:3000/api/physical-inventory/{pi_id}/lines`
3. Body:

```json
{
  "productId": "550e8400-e29b-41d4-a716-446655440002",
  "physicalQuantity": 45,
  "batchNumber": "BATCH-001",
  "notes": "Physical count completed"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "line-uuid",
    "physicalInventoryId": "pi-uuid",
    "productId": "product-uuid",
    "systemQuantity": 50,
    "physicalQuantity": 45,
    "variance": -5,
    "batchNumber": "BATCH-001",
    "notes": "Physical count completed",
    "countedBy": "user-uuid",
    "countedAt": "2026-04-02T12:05:00Z"
  }
}
```

**Repeat Step 3** for multiple products (or use a loop in curl)

---

### Step 4: List Count Lines

**Endpoint:** GET /api/physical-inventory/[id]/lines

Using curl:

```bash
PI_ID="YOUR_PI_ID_FROM_STEP_2"
curl -X GET "http://localhost:3000/api/physical-inventory/$PI_ID/lines?limit=50" \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "line-1",
      "productId": "...",
      "physicalQuantity": 45,
      "variance": -5
    },
    {
      "id": "line-2",
      "productId": "...",
      "physicalQuantity": 98,
      "variance": -2
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

---

### Step 5: Confirm Count Session

**Endpoint:** POST /api/physical-inventory/[id]/confirm  
**Effect:** Transitions status from DRAFT → CONFIRMED (read-only after this)

Using curl:

```bash
PI_ID="YOUR_PI_ID_FROM_STEP_2"
curl -X POST "http://localhost:3000/api/physical-inventory/$PI_ID/confirm" \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "notes": "Approved by supervisor"
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "pi-uuid",
    "status": "CONFIRMED",
    "totalVariance": -7,
    "variancePercentage": 2.3,
    "confirmedAt": "2026-04-02T12:10:00Z",
    "confirmedById": "user-uuid"
  },
  "message": "Physical inventory confirmed. Total variance: -7 items."
}
```

---

### Step 6: Complete Count Session & Auto-Adjust Stock

**Endpoint:** POST /api/physical-inventory/[id]/complete  
**Effect:**

- Transitions status CONFIRMED → DONE
- Creates InventoryTransactions for each variance
- Updates StockLevel quantities
- Updates Product stockQuantity

Using curl:

```bash
PI_ID="YOUR_PI_ID_FROM_STEP_2"
curl -X POST "http://localhost:3000/api/physical-inventory/$PI_ID/complete" \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "autoAdjust": true
  }'
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "physicalInventory": {
      "id": "pi-uuid",
      "status": "DONE",
      "referenceNumber": "PI-WH-001-20260402-001"
    },
    "varianceReport": {
      "totalProductsCount": 10,
      "countedProductsCount": 10,
      "uncountedProductsCount": 0,
      "totalVariance": -7,
      "accuracyPercentage": 97.7,
      "completionStatus": "10/10 items counted",
      "highVarianceItems": [
        { "productId": "...", "variance": -5, "variancePercentage": 10 }
      ],
      "missingItems": [],
      "excessItems": []
    }
  },
  "message": "Physical inventory completed. Stock adjusted for 10 items."
}
```

**Verify stock was adjusted:**

- Check `stock_levels` table: quantities should match physical counts
- Check `inventory_transactions` table: adjustment records created
- Check `products` table: stockQuantity updated

---

### Step 7: Get Variance Report

**Endpoint:** GET /api/physical-inventory/[id]/report

Using curl:

```bash
PI_ID="YOUR_PI_ID_FROM_STEP_2"
curl -X GET "http://localhost:3000/api/physical-inventory/$PI_ID/report" \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "totalProductsCount": 10,
    "countedProductsCount": 10,
    "totalVariance": -7,
    "accuracyPercentage": 97.7,
    "completionStatus": "10/10 items counted",
    "highVarianceItems": [...],
    "missingItems": [],
    "excessItems": []
  },
  "physicalInventoryStatus": "DONE",
  "referenceNumber": "PI-WH-001-20260402-001"
}
```

---

## Test Scenario 2: List with Filters

### List all physical inventories

```bash
curl -X GET "http://localhost:3000/api/physical-inventory?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Filter by location

```bash
curl -X GET "http://localhost:3000/api/physical-inventory?locationId=550e8400-e29b-41d4-a716-446655440001&limit=20" \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Filter by status

```bash
# Get only DRAFT inventories
curl -X GET "http://localhost:3000/api/physical-inventory?status=DRAFT&limit=20" \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=YOUR_SESSION_TOKEN"

# Get only CONFIRMED inventories
curl -X GET "http://localhost:3000/api/physical-inventory?status=CONFIRMED&limit=20"

# Get only DONE inventories
curl -X GET "http://localhost:3000/api/physical-inventory?status=DONE&limit=20"
```

### Filter by date range

```bash
curl -X GET "http://localhost:3000/api/physical-inventory?startDate=2026-04-01&endDate=2026-04-30&limit=20" \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## Test Scenario 3: Error Cases

### Error 1: Missing Authentication

```bash
curl -X GET "http://localhost:3000/api/physical-inventory"
```

**Expected (401):**

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### Error 2: Insufficient Permissions

Login as a user without INVENTORY_MANAGER role, then:

```bash
curl -X POST "http://localhost:3000/api/physical-inventory" \
  -H "Content-Type: application/json" \
  -d '{ "locationId": "...", ... }'
```

**Expected (403):**

```json
{
  "success": false,
  "error": "Forbidden - Requires ADMIN or INVENTORY_MANAGER role"
}
```

### Error 3: Invalid State Transition

Try to confirm an already-confirmed inventory:

```bash
# This PI is already CONFIRMED
PI_ID="CONFIRMED_PI_UUID"
curl -X POST "http://localhost:3000/api/physical-inventory/$PI_ID/confirm"
```

**Expected (400):**

```json
{
  "success": false,
  "error": "Cannot confirm CONFIRMED inventory. Only DRAFT inventories can be confirmed."
}
```

### Error 4: Validation Error

Missing required field:

```bash
curl -X POST "http://localhost:3000/api/physical-inventory" \
  -H "Content-Type: application/json" \
  -d '{ "countDate": "2026-04-02" }'
```

**Expected (400):**

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    { "code": "invalid_type", "path": ["locationId"], "message": "Required" },
    {
      "code": "invalid_enum_value",
      "path": ["countMethod"],
      "message": "Invalid enum value"
    }
  ]
}
```

### Error 5: Resource Not Found

```bash
curl -X GET "http://localhost:3000/api/physical-inventory/00000000-0000-0000-0000-000000000000"
```

**Expected (404):**

```json
{
  "success": false,
  "error": "Physical inventory not found"
}
```

---

## SQL Queries to Verify Data

### Check locations created

```sql
SELECT id, name, code, type, parent_location_id FROM locations;
```

### Check physical inventories

```sql
SELECT
  pi.id,
  pi.reference_number,
  pi.status,
  l.name as location,
  pi.count_date,
  pi.total_variance
FROM physical_inventories pi
JOIN locations l ON pi.location_id = l.id
ORDER BY pi.created_at DESC;
```

### Check count lines

```sql
SELECT
  pil.id,
  p.name as product,
  pil.system_quantity,
  pil.physical_quantity,
  pil.variance,
  pil.batch_number
FROM physical_inventory_lines pil
JOIN products p ON pil.product_id = p.id
ORDER BY pil.created_at DESC;
```

### Check stock adjustments

```sql
SELECT
  it.id,
  p.name as product,
  it.type,
  it.quantity,
  it.created_at
FROM inventory_transactions it
JOIN products p ON it.product_id = p.id
WHERE it.type = 'ADJUSTMENT'
ORDER BY it.created_at DESC;
```

### Check stock levels updated

```sql
SELECT
  sl.id,
  p.name as product,
  l.name as location,
  sl.quantity
FROM stock_levels sl
JOIN products p ON sl.product_id = p.id
JOIN locations l ON sl.location_id = l.id
ORDER BY sl.updated_at DESC;
```

---

## Postman Collection Import

Create a Postman collection with these requests:

```json
{
  "info": {
    "name": "Physical Inventory API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Physical Inventory",
      "method": "POST",
      "url": "{{base_url}}/api/physical-inventory",
      "body": {
        "mode": "raw",
        "raw": "{\"locationId\":\"550e8400-e29b-41d4-a716-446655440001\",\"countDate\":\"2026-04-02\",\"countMethod\":\"FULL_COUNT\",\"notes\":\"Test count\"}"
      }
    },
    {
      "name": "List Physical Inventories",
      "method": "GET",
      "url": "{{base_url}}/api/physical-inventory?page=1&limit=20"
    },
    {
      "name": "Get Physical Inventory",
      "method": "GET",
      "url": "{{base_url}}/api/physical-inventory/{{pi_id}}"
    },
    {
      "name": "Add Count Line",
      "method": "POST",
      "url": "{{base_url}}/api/physical-inventory/{{pi_id}}/lines",
      "body": {
        "mode": "raw",
        "raw": "{\"productId\":\"550e8400-e29b-41d4-a716-446655440002\",\"physicalQuantity\":45,\"batchNumber\":\"BATCH-001\"}"
      }
    },
    {
      "name": "List Count Lines",
      "method": "GET",
      "url": "{{base_url}}/api/physical-inventory/{{pi_id}}/lines"
    },
    {
      "name": "Confirm Count",
      "method": "POST",
      "url": "{{base_url}}/api/physical-inventory/{{pi_id}}/confirm",
      "body": {
        "mode": "raw",
        "raw": "{\"notes\":\"Approved\"}"
      }
    },
    {
      "name": "Complete Count",
      "method": "POST",
      "url": "{{base_url}}/api/physical-inventory/{{pi_id}}/complete",
      "body": {
        "mode": "raw",
        "raw": "{\"autoAdjust\":true}"
      }
    },
    {
      "name": "Get Variance Report",
      "method": "GET",
      "url": "{{base_url}}/api/physical-inventory/{{pi_id}}/report"
    }
  ]
}
```

**Set Postman Variables:**

```
base_url = http://localhost:3000
pi_id = (copy from Create Physical Inventory response)
```

---

## Debugging Tips

### Issue: "Unauthorized" on all requests

- **Cause:** Not logged in or session expired
- **Fix:** Log in via browser first, or add session cookie manually

### Issue: "Forbidden" response

- **Cause:** User doesn't have INVENTORY_MANAGER or ADMIN role
- **Fix:** Log in as admin user, or assign role to user

### Issue: "Cannot add count lines to CONFIRMED inventory"

- **Cause:** Trying to add lines after count was confirmed
- **Fix:** Only add lines while status is DRAFT

### Issue: Validation error with "physicalInventoryId"

- **Cause:** Endpoint constructs this automatically, don't send it in body
- **Fix:** Remove from request body, endpoint uses path param

### Issue: Stock not adjusting on complete

- **Cause:** autoAdjust might be false, or products don't exist
- **Fix:** Set autoAdjust: true, verify product UUIDs

---

## Performance Baseline

Typical response times (on development server):

- Create PI: 50-100ms
- Add line: 10-20ms
- List: 20-50ms
- Confirm: 50-100ms
- Complete: 200-500ms (includes stock updates)
- Report: 50-100ms

If response times exceed these, check:

- Database connection latency
- Number of products being counted
- Server load

---

## Next Steps After Testing

Once Phase 2 testing passes:

1. ✅ Phase 2 API routes validated
2. ⏳ Phase 3: UI Pages & Components
   - Create pages for list view
   - Create counting interface
   - Add variance reports
   - Integrate NumericKeypad
3. ⏳ Phase 4: Full integration testing

---

**Test Date:** April 2, 2026  
**API Version:** Phase 2 Complete  
**Status:** ✅ Ready for Testing
