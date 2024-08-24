// src/config/config.ts
interface DBConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
}

export const DB_CONFIG = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "mypodcast",
  password: process.env.DB_PASSWORD || "123456",
  port: Number(process.env.DB_PORT) || 5432,
};
