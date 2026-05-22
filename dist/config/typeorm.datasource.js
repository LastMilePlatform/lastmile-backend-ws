"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const typeorm_1 = require("typeorm");
const databaseUrl = process.env.DATABASE_URL;
const dbPort = Number(process.env.DB_PORT ?? 5432);
const baseConfig = {
    type: 'postgres',
    entities: ['src/modules/**/entities/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
    migrationsTransactionMode: 'each',
    extra: {
        family: 4,
    },
};
const options = databaseUrl && databaseUrl.trim().length > 0
    ? {
        ...baseConfig,
        url: databaseUrl,
    }
    : {
        ...baseConfig,
        host: process.env.DB_HOST,
        port: dbPort,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    };
exports.default = new typeorm_1.DataSource(options);
//# sourceMappingURL=typeorm.datasource.js.map