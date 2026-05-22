"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionBiddingFields1773200000000 = void 0;
class AuctionBiddingFields1773200000000 {
    name = 'AuctionBiddingFields1773200000000';
    transaction = false;
    async up(queryRunner) {
        await queryRunner.query(`ALTER TYPE "public"."auctions_status_enum" ADD VALUE IF NOT EXISTS 'created'`);
        await queryRunner.query(`ALTER TYPE "public"."auctions_status_enum" ADD VALUE IF NOT EXISTS 'closed'`);
        await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'auctions'
            AND column_name = 'price'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'auctions'
            AND column_name = 'initialPrice'
        ) THEN
          ALTER TABLE "auctions" RENAME COLUMN "price" TO "initialPrice";
        END IF;
      END;
      $$;
    `);
        await queryRunner.query(`ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "currentPrice" numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "durationMinutes" integer NOT NULL DEFAULT 60`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "endAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "auctions" ALTER COLUMN "status" SET DEFAULT 'created'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "auctions" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP COLUMN "endAt"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP COLUMN "startedAt"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP COLUMN "durationMinutes"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP COLUMN "currentPrice"`);
        await queryRunner.query(`ALTER TABLE "auctions" RENAME COLUMN "initialPrice" TO "price"`);
    }
}
exports.AuctionBiddingFields1773200000000 = AuctionBiddingFields1773200000000;
//# sourceMappingURL=1773200000000-auction-bidding-fields.js.map