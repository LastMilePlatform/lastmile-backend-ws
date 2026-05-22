"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAuctionBidMode1773200000004 = void 0;
class AddAuctionBidMode1773200000004 {
    name = 'AddAuctionBidMode1773200000004';
    transaction = false;
    async up(queryRunner) {
        await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."auctions_bid_mode_enum" AS ENUM('free', 'fixed_increment');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
        await queryRunner.query(`ALTER TABLE "auctions"
        ADD COLUMN IF NOT EXISTS "bid_mode" "public"."auctions_bid_mode_enum" NOT NULL DEFAULT 'free',
        ADD COLUMN IF NOT EXISTS "bid_increment" numeric(12,2) NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "auctions"
        DROP COLUMN IF EXISTS "bid_increment",
        DROP COLUMN IF EXISTS "bid_mode"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."auctions_bid_mode_enum"`);
    }
}
exports.AddAuctionBidMode1773200000004 = AddAuctionBidMode1773200000004;
//# sourceMappingURL=1773200000004-add-auction-bid-mode.js.map