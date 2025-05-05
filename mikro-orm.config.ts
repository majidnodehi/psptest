import { defineConfig } from '@mikro-orm/postgresql';
import { Click } from './src/entities/click.entity';
import 'dotenv/config';
import { Url } from './src/entities/url.entity';


const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export default defineConfig({
  entities: [Url, Click],
  clientUrl: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,

  debug: process.env.NODE_ENV === 'development',
  migrations: {
    path: './dist/database/migrations',
    pathTs: './src/database/migrations',
  },
});