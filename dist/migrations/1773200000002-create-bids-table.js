"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBidsTable1773200000002 = void 0;
class CreateBidsTable1773200000002 {
    name = 'CreateBidsTable1773200000002';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bids" (
        "id" SERIAL NOT NULL,
        "auctionId" integer NOT NULL,
        "userId" integer NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bids" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_bids_auction_created_at"
      ON "bids" ("auctionId", "createdAt")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_bids_auction_created_at"`);
        await queryRunner.query(`DROP TABLE "bids"`);
    }
}
exports.CreateBidsTable1773200000002 = CreateBidsTable1773200000002;
//# sourceMappingURL=1773200000002-create-bids-table.js.map