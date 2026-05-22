"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeOrmConfig = getTypeOrmConfig;
function getTypeOrmConfig(configService) {
    const isProduction = process.env.NODE_ENV === 'production';
    const databaseUrl = configService.get('DATABASE_URL');
    return {
        type: 'postgres',
        ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: configService.getOrThrow('DB_HOST'),
                port: configService.get('DB_PORT', 5432),
                username: configService.getOrThrow('DB_USERNAME'),
                password: configService.getOrThrow('DB_PASSWORD'),
                database: configService.getOrThrow('DB_NAME'),
            }),
        ssl: databaseUrl ? { rejectUnauthorized: false } : false,
        extra: { family: 4 },
        autoLoadEntities: true,
        synchronize: !isProduction,
        ...(isProduction && {
            migrations: ['dist/migrations/*.js'],
            migrationsRun: true,
        }),
    };
}
//# sourceMappingURL=database.config.js.map