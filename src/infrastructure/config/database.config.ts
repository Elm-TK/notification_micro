export const databaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'etk',
    database: process.env.DB_NAME || 'notifications_db',
    entities: [__dirname + '/../entities/*.ts'],
};
