"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAuctionWinnerAndNotifications1773200000003 = void 0;
class AddAuctionWinnerAndNotifications1773200000003 {
    name = 'AddAuctionWinnerAndNotifications1773200000003';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "winnerId" integer`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer NOT NULL,
        "message" text NOT NULL,
        "auctionId" integer,
        "read" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_notifications_user_created_at"
      ON "notifications" ("userId", "createdAt")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_user_created_at"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
        await queryRunner.query(`ALTER TABLE "auctions" DROP COLUMN IF EXISTS "winnerId"`);
    }
}
exports.AddAuctionWinnerAndNotifications1773200000003 = AddAuctionWinnerAndNotifications1773200000003;
//# sourceMappingURL=1773200000003-add-auction-winner-and-notifications.js.map