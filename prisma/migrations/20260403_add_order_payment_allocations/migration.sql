CREATE TYPE "OrderAllocationType" AS ENUM ('SALES_ORDER', 'PURCHASE_ORDER');

CREATE TABLE "order_payment_allocations" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "orderType" "OrderAllocationType" NOT NULL,
  "salesOrderId" TEXT,
  "purchaseOrderId" TEXT,
  "orderPaymentId" TEXT,
  "allocatedAmount" DECIMAL(12, 2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "order_payment_allocations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "order_payment_allocations_orderPaymentId_key"
  ON "order_payment_allocations"("orderPaymentId");

CREATE INDEX "order_payment_allocations_paymentId_idx"
  ON "order_payment_allocations"("paymentId");

CREATE INDEX "order_payment_allocations_salesOrderId_idx"
  ON "order_payment_allocations"("salesOrderId");

CREATE INDEX "order_payment_allocations_purchaseOrderId_idx"
  ON "order_payment_allocations"("purchaseOrderId");

CREATE INDEX "order_payment_allocations_orderType_idx"
  ON "order_payment_allocations"("orderType");

ALTER TABLE "order_payment_allocations"
  ADD CONSTRAINT "order_payment_allocations_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "payments"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_payment_allocations"
  ADD CONSTRAINT "order_payment_allocations_salesOrderId_fkey"
  FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_payment_allocations"
  ADD CONSTRAINT "order_payment_allocations_purchaseOrderId_fkey"
  FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_payment_allocations"
  ADD CONSTRAINT "order_payment_allocations_orderPaymentId_fkey"
  FOREIGN KEY ("orderPaymentId") REFERENCES "order_payments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
