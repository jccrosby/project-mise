import { Pool, PoolConfig } from 'pg';
import { config } from '../../config/database';
import { logger } from '../logger';

class DatabaseConnection {
  private pool: Pool | null = null;
  private static instance: DatabaseConnection;

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<Pool> {
    if (this.pool) {
      return this.pool;
    }

    try {
      const poolConfig: PoolConfig = {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        max: config.maxConnections,
        idleTimeoutMillis: config.idleTimeout,
        connectionTimeoutMillis: config.connectionTimeout,
        ssl: config.ssl,
      };

      this.pool = new Pool(poolConfig);

      // Test the connection
      await this.pool.query('SELECT NOW()');

      logger.info('Database connected successfully', {
        host: config.host,
        port: config.port,
        database: config.database,
      });

      // Handle pool errors
      this.pool.on('error', (err) => {
        logger.error('Unexpected error on idle client', err);
      });

      return this.pool;
    } catch (error) {
      logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('Database disconnected');
    }
  }

  public getPool(): Pool | null {
    return this.pool;
  }

  public async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Executed query', {
        query: text,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });

      return result;
    } catch (error) {
      logger.error('Query failed', { query: text, error });
      throw error;
    }
  }

  public async getClient() {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return this.pool.connect();
  }
}

export const database = DatabaseConnection.getInstance();
export default database;
