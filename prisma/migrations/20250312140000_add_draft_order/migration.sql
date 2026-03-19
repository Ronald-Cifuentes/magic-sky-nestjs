-- CreateTable
CREATE TABLE "DraftOrder" (
    "id" TEXT NOT NULL,
    "draft_number" TEXT NOT NULL,
    "customer_id" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "total" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'COP',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftOrderItem" (
    "id" TEXT NOT NULL,
    "draft_order_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" INTEGER NOT NULL,
    "total_price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DraftOrder_draft_number_key" ON "DraftOrder"("draft_number");

-- CreateIndex
CREATE INDEX "DraftOrderItem_draft_order_id_idx" ON "DraftOrderItem"("draft_order_id");

-- AddForeignKey
ALTER TABLE "DraftOrder" ADD CONSTRAINT "DraftOrder_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftOrderItem" ADD CONSTRAINT "DraftOrderItem_draft_order_id_fkey" FOREIGN KEY ("draft_order_id") REFERENCES "DraftOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftOrderItem" ADD CONSTRAINT "DraftOrderItem_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
