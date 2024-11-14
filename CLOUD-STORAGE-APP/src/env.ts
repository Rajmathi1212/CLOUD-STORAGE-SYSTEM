import dotenv from 'dotenv';
dotenv.config();

export default {
  PORT: process.env.PORT ? parseInt(process.env.PORT) :8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  BASE_URL: process.env.NODE_ENV != 'development' ? process.env.PROD_BASE_URL : process.env.DEV_BASE_URL,
  DB_URL: process.env.DB_URL,
};
