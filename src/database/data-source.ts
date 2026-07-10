import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }),

  entities: ['dist/**/*.entity.js'],

  migrations: ['dist/database/migrations/*.js'],

  synchronize: false,

  ssl:
    process.env.ENV === 'PROD'
      ? {
          rejectUnauthorized: false,
        }
      : false,
});
