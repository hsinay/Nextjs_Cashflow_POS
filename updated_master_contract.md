# Master Contract v1.3.0

## 🔐 Core Entities

### User
- `id` (UUID, PK)  
- `username` (string, unique, required)  
- `email` (string, unique, required)  
- `password` (string, hashed)  
- `contactNumber` (string, optional)  
- `roles` (many-to-many Role)  

---

### Role
- `id` (UUID, PK)  
- `name` (enum: ADMIN, INVENTORY_MANAGER, SALES_MANAGER, PURCHASE_MANAGER, ACCOUNTANT, CASHIER, CUSTOMER, SUPPLIER)  
- `description` (string, optional)  

---

### Customer
- `id` (UUID, PK)  
- `name` (string, required)  
- `email` (string, unique, optional)  
- `contactNumber` (string, optional)  
- `billingAddress` (string, optional)  
- `shippingAddress` (string, optional)  
- `creditLimit` (decimal, optional, default 0)  
- `outstandingBalance` (decimal, calculated)  
- `loyaltyPoints` (int, default 0)  
- `aiSegment` (enum: HIGH_VALUE, PRICE_SENSITIVE, LOYAL, OCCASIONAL, NEW)  
- `churnRiskScore` (decimal, optional – AI predicted 0–1)  

---

### Supplier
- `id` (UUID, PK)  
- `name` (string, required)  
- `email` (string, unique, optional)  
- `contactNumber` (string, optional)  
- `address` (string, optional)  
- `creditLimit` (decimal, optional, default 0)  
- `outstandingBalance` (decimal, calculated)  

---

### Product
- `id` (UUID, PK)  
- `name` (string, required)  
- `description` (text, optional)  
- `sku` (string, unique, optional)  
- `barcode` (string, optional – for POS scanning)  
- `imageUrl` (string/blob, optional – product image for POS/catalogs)  
- `price` (decimal, required – selling price)  
- `costPrice` (decimal, optional – purchase/landing cost)  
- `stockQuantity` (int, required)  
- `reorderLevel` (int, optional – min stock level for alerts)  
- `taxRate` (decimal, optional – tax percentage for POS calculations)  
- `isActive` (boolean, default true – product visibility)  
- `categoryId` (FK → Category)  
- `aiTags` (array[string], optional – AI generated tags for recommendations & analytics)  
- `visionEmbedding` (json/blob, optional – AI feature vector for image recognition)  

---

### Category
- `id` (UUID, PK)  
- `name` (string, required)  
- `description` (string, optional)  
- `parentCategoryId` (FK → Category, optional)  
- `imageUrl` (string, optional – category icon for POS menus)  

---

## 📦 Purchase & Inventory

### PurchaseOrder
- `id` (UUID, PK)  
- `supplierId` (FK → Supplier, required)  
- `orderDate` (datetime, required)  
- `status` (enum: DRAFT, CONFIRMED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED)  
- `totalAmount` (decimal, required)  
- `balanceAmount` (decimal, required – for credit tracking)  

### PurchaseOrderItem
- `id` (UUID, PK)  
- `purchaseOrderId` (FK → PurchaseOrder, required)  
- `productId` (FK → Product, required)  
- `quantity` (int, required)  
- `unitPrice` (decimal, required)  
- `discount` (decimal, optional – % or absolute)  
- `taxAmount` (decimal, calculated)  
- `subtotal` (decimal, calculated)  

---

### InventoryTransaction
- `id` (UUID, PK)  
- `productId` (FK → Product, required)  
- `transactionType` (enum: PURCHASE, SALE, ADJUSTMENT, RETURN, POS_SALE)  
- `quantity` (int, required)  
- `transactionDate` (datetime, required)  
- `notes` (decimal, optional – cost at transaction time)  
- `unitCost` (String, optional – String)  
- `referenceId` (string/UUID – links to order/invoice/pos_transaction)  
- `predictedDemandImpact` (decimal, optional – AI forecast of demand impact)  
- `forecastedReorderDate` (datetime, optional – AI suggested replenishment date)  

---

## 💰 Sales & Credit (Traditional Orders)

### SalesOrder
- `id` (UUID, PK)  
- `customerId` (FK → Customer, required)  
- `orderDate` (datetime, required)  
- `status` (enum: DRAFT, CONFIRMED, PARTIALLY_PAID, PAID, CANCELLED)  
- `totalAmount` (decimal, required)  
- `balanceAmount` (decimal, required – for credit tracking)  
- `aiUpsellSuggestions` (array[string], optional – recommended products at checkout)  
- `createdAt` (datetime, required)  
- `updatedAt` (datetime, optional)  

### SalesOrderItem
- `id` (UUID, PK)  
- `salesOrderId` (FK → SalesOrder, required)  
- `productId` (FK → Product, required)  
- `quantity` (int, required)  
- `unitPrice` (decimal, required)  
- `discount` (decimal, optional – % or absolute)  
- `taxAmount` (decimal, calculated)  
- `subtotal` (decimal, calculated)  
- `createdAt` (datetime, required)  
- `updatedAt` (datetime, optional)  

---

## 🏪 Point of Sale (POS) System

### POSSession
- `id` (UUID, PK)  
- `cashierId` (FK → User, required)  
- `terminalId` (string, optional)  
- `status` (enum: OPEN, CLOSED, SUSPENDED)  
- `openingCashAmount` (decimal, required)  
- `closingCashAmount` (decimal, optional)  
- `totalSalesAmount` (decimal, calculated)  
- `totalCashReceived` (decimal, calculated)  
- `totalCardReceived` (decimal, calculated)  
- `totalDigitalReceived` (decimal, calculated)  
- `totalTransactions` (int, calculated)  
- `cashVariance` (decimal, calculated – closing vs expected)  
- `openedAt` (datetime, required)  
- `closedAt` (datetime, optional)  
- `notes` (text, optional)  

### Transaction
- `id` (UUID, PK)  
- `transactionNumber` (string, unique, required)  
- `customerId` (FK → Customer, optional)  
- `cashierId` (FK → User, required)  
- `sessionId` (FK → POSSession, optional)  
- `totalAmount` (decimal, required)  
- `taxAmount` (decimal, default 0)  
- `discountAmount` (decimal, default 0)  
- `paymentMethod` (enum: CASH, CARD, UPI, BANK_TRANSFER, DIGITAL_WALLET, MIXED)  
- `status` (enum: PENDING, COMPLETED, CANCELLED, REFUNDED)  
- `loyaltyPointsEarned` (int, default 0)  
- `loyaltyPointsRedeemed` (int, default 0)  
- `notes` (text, optional)  
- `createdAt` (datetime, required)  
- `updatedAt` (datetime, optional)  

### TransactionItem
- `id` (UUID, PK)  
- `transactionId` (FK → Transaction, required)  
- `productId` (FK → Product, required)  
- `quantity` (int, required)  
- `unitPrice` (decimal, required)  
- `totalPrice` (decimal, required)  
- `discountApplied` (decimal, default 0)  
- `taxRate` (decimal, optional)  
- `taxAmount` (decimal, default 0)  
- `createdAt` (datetime, required)  
- `updatedAt` (datetime, optional)  

### POSPaymentDetail
- `id` (UUID, PK)  
- `transactionId` (FK → Transaction, required)  
- `paymentMethod` (enum: CASH, CARD, UPI, BANK_TRANSFER, DIGITAL_WALLET)  
- `amount` (decimal, required)  
- `referenceNumber` (string, optional)  
- `status` (enum: PENDING, COMPLETED, FAILED, REFUNDED)  
- `notes` (text, optional)  
- `createdAt` (datetime, required)  
- `updatedAt` (datetime, optional)  

### Receipt
- `id` (UUID, PK)  
- `transactionId` (FK → Transaction, required, one-to-one)  
- `receiptNumber` (string, unique, required)  
- `receiptData` (text, optional – formatted receipt content)  
- `printCount` (int, default 0)  
- `lastPrintedAt` (datetime, optional)  
- `createdAt` (datetime, required)  
- `updatedAt` (datetime, optional)  

---

## 🦄 Payments & Accounting

### Payment
- `id` (UUID, PK)  
- `payerType` (enum: CUSTOMER, SUPPLIER)  
- `payerId` (UUID, required)  
- `paymentDate` (datetime, required)  
- `amount` (decimal, required)  
- `paymentMethod` (enum: CASH, BANK_TRANSFER, CARD, UPI, CHEQUE)  
- `referenceOrderId` (UUID, optional – FK → SalesOrder/PurchaseOrder)  
- `paymentInsights` (string, optional – AI annotation e.g., frequent late payer, prefers card)  
- `referenceNumber` (string, optional – referenceNumber)  
- `notes` (string, optional – notes)  
- `createdAt` (datetime, optional)  
- `updatedAt` (datetime, optional)  

### LedgerEntry
- `id` (UUID, PK)  
- `entryDate` (datetime, required)  
- `description` (string, required)  
- `debitAccount` (string, required)  
- `creditAccount` (string, required)  
- `amount` (decimal, required)  
- `referenceId` (UUID, optional – Payment/Sales/Purchase/Transaction link)  
- `createdAt` (datetime, optional)  
- `updatedAt` (datetime, optional)  

---

### 🔗 Relationships Overview
- **Traditional Sales:** Customer → SalesOrder → SalesOrderItem → Product  
- **Purchase Flow:** Supplier → PurchaseOrder → PurchaseOrderItem → Product  
- **POS Sales Flow:** Customer → Transaction → TransactionItem → Product  
- **POS Payments:** Transaction → POSPaymentDetail  
- **POS Receipts:** Transaction → Receipt  
- **POS Sessions:** User (Cashier) → POSSession → Transaction  
- **Inventory Tracking:** All sales (traditional & POS) → InventoryTransaction  
- **Financial Records:** Payment reduces `balanceAmount` on SalesOrder/PurchaseOrder and updates Customer/Supplier outstanding balances.  
- **Accounting:** LedgerEntry ensures double-entry bookkeeping for all financial transactions.  
- **AI Features:**  
  - Auto-inventory predictions (`InventoryTransaction.forecastedReorderDate`)  
  - Predictive sales insights (`SalesOrder.aiUpsellSuggestions`)  
  - Customer insights (`Customer.aiSegment`, `churnRiskScore`)  
  - Product recommendations via `aiTags` and `visionEmbedding`  
  - Tax calculations via `Product.taxRate` for POS transactions
