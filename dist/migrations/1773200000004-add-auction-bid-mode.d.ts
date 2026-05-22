import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddAuctionBidMode1773200000004 implements MigrationInterface {
    name: string;
    transaction: boolean;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
