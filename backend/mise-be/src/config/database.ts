interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  ssl: boolean | object;
}

interface TestDatabaseConfig extends DatabaseConfig {
  testDatabase: string;
}

const isDevelopment =
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

export const config: DatabaseConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: isTest
    ? process.env.POSTGRES_TEST_DB || 'mise_test'
    : process.env.POSTGRES_DB || 'mise_dev',
  user: process.env.POSTGRES_USER || 'mise_user',
  password: process.env.POSTGRES_PASSWORD || 'mise_password',
  maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20', 10),
  idleTimeout: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000', 10),
  connectionTimeout: parseInt(
    process.env.POSTGRES_CONNECTION_TIMEOUT || '5000',
    10
  ),
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};

export const testConfig: TestDatabaseConfig = {
  ...config,
  database: process.env.POSTGRES_TEST_DB || 'mise_test',
  testDatabase: process.env.POSTGRES_TEST_DB || 'mise_test',
};

export default config;
