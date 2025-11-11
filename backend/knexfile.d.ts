interface KnexConfig {
    client: string;
    connection: {
        host?: string;
        port?: number;
        database?: string;
        user?: string;
        password?: string;
        ssl?: boolean | {
            rejectUnauthorized: boolean;
        };
    };
    pool: {
        min: number;
        max: number;
    };
    migrations: {
        tableName: string;
        directory: string;
    };
}
declare const config: {
    [key: string]: KnexConfig;
};
export default config;
//# sourceMappingURL=knexfile.d.ts.map