"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakePickupCoordinatesNullable1773300000000 = void 0;
class MakePickupCoordinatesNullable1773300000000 {
    name = 'MakePickupCoordinatesNullable1773300000000';
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE "pickup_points" ALTER COLUMN "latitude" DROP NOT NULL');
        await queryRunner.query('ALTER TABLE "pickup_points" ALTER COLUMN "longitude" DROP NOT NULL');
    }
    async down(queryRunner) {
        await queryRunner.query('ALTER TABLE "pickup_points" ALTER COLUMN "latitude" SET NOT NULL');
        await queryRunner.query('ALTER TABLE "pickup_points" ALTER COLUMN "longitude" SET NOT NULL');
    }
}
exports.MakePickupCoordinatesNullable1773300000000 = MakePickupCoordinatesNullable1773300000000;
//# sourceMappingURL=1773300000000-make-pickup-coordinates-nullable.js.map