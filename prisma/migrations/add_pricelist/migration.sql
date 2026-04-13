-- CreateEnum
CREATE TYPE "PriceCalculationType" AS ENUM ('FIXED_PRICE', 'PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FORMULA');

-- CreateEnum
CREATE TYPE "PricelistAppliedTo" AS ENUM ('PRODUCT', 'CATEGORY', 'CUSTOMER', 'ALL_PRODUCTS');

-- CreateTable
CREATE TABLE "pricelists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "applicableToCustomer" TEXT,
    "applicableToCategory" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricelists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricelist_rules" (
    "id" TEXT NOT NULL,
    "pricelistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxQuantity" INTEGER,
    "appliedTo" "PricelistAppliedTo" NOT NULL DEFAULT 'PRODUCT',
    "productId" TEXT,
    "categoryId" TEXT,
    "customerGroupId" TEXT,
    "calculationType" "PriceCalculationType" NOT NULL DEFAULT 'PERCENTAGE_DISCOUNT',
    "discountPercentage" DECIMAL(5,2),
    "fixedPrice" DECIMAL(12,2),
    "fixedDiscount" DECIMAL(12,2),
    "formulaMargin" DECIMAL(12,2),
    "formulaMarkup" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricelist_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricelist_items" (
    "id" TEXT NOT NULL,
    "pricelistId" TEXT NOT NULL,
    "productId" TEXT,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "calculatedPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricelist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pricelists_isActive_idx" ON "pricelists"("isActive");

-- CreateIndex
CREATE INDEX "pricelists_priority_idx" ON "pricelists"("priority");

-- CreateIndex
CREATE INDEX "pricelists_startDate_idx" ON "pricelists"("startDate");

-- CreateIndex
CREATE INDEX "pricelists_endDate_idx" ON "pricelists"("endDate");

-- CreateIndex
CREATE INDEX "pricelist_rules_pricelistId_idx" ON "pricelist_rules"("pricelistId");

-- CreateIndex
CREATE INDEX "pricelist_rules_productId_idx" ON "pricelist_rules"("productId");

-- CreateIndex
CREATE INDEX "pricelist_rules_categoryId_idx" ON "pricelist_rules"("categoryId");

-- CreateIndex
CREATE INDEX "pricelist_rules_minQuantity_idx" ON "pricelist_rules"("minQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "pricelist_items_pricelistId_productId_key" ON "pricelist_items"("pricelistId", "productId");

-- CreateIndex
CREATE INDEX "pricelist_items_pricelistId_idx" ON "pricelist_items"("pricelistId");

-- CreateIndex
CREATE INDEX "pricelist_items_productId_idx" ON "pricelist_items"("productId");

-- AddForeignKey
ALTER TABLE "pricelist_rules" ADD CONSTRAINT "pricelist_rules_pricelistId_fkey" FOREIGN KEY ("pricelistId") REFERENCES "pricelists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricelist_rules" ADD CONSTRAINT "pricelist_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricelist_rules" ADD CONSTRAINT "pricelist_rules_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricelist_items" ADD CONSTRAINT "pricelist_items_pricelistId_fkey" FOREIGN KEY ("pricelistId") REFERENCES "pricelists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricelist_items" ADD CONSTRAINT "pricelist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
