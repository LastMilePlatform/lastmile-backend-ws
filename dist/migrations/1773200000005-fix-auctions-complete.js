"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixAuctionsComplete1773200000005 = void 0;
class FixAuctionsComplete1773200000005 {
    name = 'FixAuctionsComplete1773200000005';
    async up(queryRunner) {
        await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'auctions' AND column_name = 'bid_mode'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'auctions' AND column_name = 'bidMode'
        ) THEN
          ALTER TABLE "auctions" RENAME COLUMN "bid_mode" TO "bidMode";
        END IF;
      END $$;
    `);
        await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'auctions' AND column_name = 'bid_increment'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'auctions' AND column_name = 'bidIncrement'
        ) THEN
          ALTER TABLE "auctions" RENAME COLUMN "bid_increment" TO "bidIncrement";
        END IF;
      END $$;
    `);
        await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."auctions_bid_mode_enum" AS ENUM('free', 'fixed_increment');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
        await queryRunner.query(`
      ALTER TABLE "auctions"
        ADD COLUMN IF NOT EXISTS "bidMode" "public"."auctions_bid_mode_enum" NOT NULL DEFAULT 'free'
    `);
        await queryRunner.query(`
      ALTER TABLE "auctions"
        ADD COLUMN IF NOT EXISTS "bidIncrement" numeric(12,2) NULL
    `);
        await queryRunner.query(`
      ALTER TABLE "auctions"
        ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auction_buy_idempotency_records" (
        "id" SERIAL NOT NULL,
        "auctionId" integer NOT NULL,
        "buyerId" integer NOT NULL,
        "idempotencyKey" character varying(100) NOT NULL,
        "statusCode" integer NOT NULL,
        "responsePayload" jsonb NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auction_buy_idempotency_records" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_auction_buy_idempotency"
      ON "auction_buy_idempotency_records" ("auctionId", "buyerId", "idempotencyKey")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "uq_auction_buy_idempotency"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "auction_buy_idempotency_records"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP COLUMN IF EXISTS "version"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP COLUMN IF EXISTS "bidIncrement"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP COLUMN IF EXISTS "bidMode"`);
    }
}
exports.FixAuctionsComplete1773200000005 = FixAuctionsComplete1773200000005;
//# sourceMappingURL=1773200000005-fix-auctions-complete.js.map