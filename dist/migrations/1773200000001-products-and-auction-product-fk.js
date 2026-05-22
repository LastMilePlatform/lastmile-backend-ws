"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsAndAuctionProductFk1773200000001 = void 0;
class ProductsAndAuctionProductFk1773200000001 {
    name = 'ProductsAndAuctionProductFk1773200000001';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" SERIAL NOT NULL,
        "name" character varying(150) NOT NULL,
        "description" text,
        "createdBy" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "productId" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "auctions" ALTER COLUMN "productId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "auctions" ALTER COLUMN "campaignId" DROP NOT NULL`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_auctions_campaign_status_created_at"`);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_auctions_product_status_created_at"
      ON "auctions" ("productId", "status", "createdAt")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_auctions_product_status_created_at"`);
        await queryRunner.query(`
      CREATE INDEX "idx_auctions_campaign_status_created_at"
      ON "auctions" ("campaignId", "status", "createdAt")
    `);
        await queryRunner.query(`ALTER TABLE "auctions" ALTER COLUMN "campaignId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP COLUMN "productId"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }
}
exports.ProductsAndAuctionProductFk1773200000001 = ProductsAndAuctionProductFk1773200000001;
//# sourceMappingURL=1773200000001-products-and-auction-product-fk.js.map