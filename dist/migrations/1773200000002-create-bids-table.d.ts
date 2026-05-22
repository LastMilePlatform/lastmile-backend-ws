import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateBidsTable1773200000002 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
