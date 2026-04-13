DROP INDEX IF EXISTS "order_payment_allocations_orderPaymentId_key";

ALTER TABLE "order_payment_allocations"
DROP CONSTRAINT IF EXISTS "order_payment_allocations_orderPaymentId_fkey";

ALTER TABLE "order_payment_allocations"
DROP COLUMN IF EXISTS "orderPaymentId";

DROP TABLE IF EXISTS "order_payments";
