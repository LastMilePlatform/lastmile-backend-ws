type EnvConfig = {
    PORT: number;
    DATABASE_URL?: string;
    DB_HOST?: string;
    DB_PORT: number;
    DB_USERNAME?: string;
    DB_PASSWORD?: string;
    DB_NAME?: string;
    JWT_SECRET: string;
    GOOGLE_CLIENT_ID?: string;
    REQUEST_SIGNING_SECRET?: string;
};
export declare function validateEnv(config: Record<string, unknown>): EnvConfig;
export {};
