import { database } from './connection';
import { logger } from '../logger';

export interface EmbeddingInput {
  contentType: string;
  contentId?: string;
  title?: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

export interface EmbeddingRecord {
  id: string;
  contentType: string;
  contentId?: string;
  title?: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimilaritySearchOptions {
  limit?: number;
  threshold?: number;
  contentType?: string;
  metadata?: Record<string, any>;
}

export interface SimilarityResult extends EmbeddingRecord {
  similarity: number;
}

export class VectorService {
  async createEmbedding(input: EmbeddingInput): Promise<EmbeddingRecord> {
    const query = `
      INSERT INTO app.embeddings (content_type, content_id, title, content, embedding, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, content_type, content_id, title, content, embedding, metadata, created_at, updated_at
    `;

    const values = [
      input.contentType,
      input.contentId,
      input.title,
      input.content,
      JSON.stringify(input.embedding),
      JSON.stringify(input.metadata || {}),
    ];

    try {
      const result = await database.query(query, values);
      const row = result.rows[0];

      return {
        id: row.id,
        contentType: row.content_type,
        contentId: row.content_id,
        title: row.title,
        content: row.content,
        embedding: JSON.parse(row.embedding),
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error('Failed to create embedding', { error, input });
      throw error;
    }
  }

  async getEmbedding(id: string): Promise<EmbeddingRecord | null> {
    const query = `
      SELECT id, content_type, content_id, title, content, embedding, metadata, created_at, updated_at
      FROM app.embeddings
      WHERE id = $1
    `;

    try {
      const result = await database.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        contentType: row.content_type,
        contentId: row.content_id,
        title: row.title,
        content: row.content,
        embedding: JSON.parse(row.embedding),
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error('Failed to get embedding', { error, id });
      throw error;
    }
  }

  async updateEmbedding(
    id: string,
    updates: Partial<EmbeddingInput>
  ): Promise<EmbeddingRecord | null> {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.contentType !== undefined) {
      setParts.push(`content_type = $${paramCount++}`);
      values.push(updates.contentType);
    }
    if (updates.contentId !== undefined) {
      setParts.push(`content_id = $${paramCount++}`);
      values.push(updates.contentId);
    }
    if (updates.title !== undefined) {
      setParts.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      setParts.push(`content = $${paramCount++}`);
      values.push(updates.content);
    }
    if (updates.embedding !== undefined) {
      setParts.push(`embedding = $${paramCount++}`);
      values.push(JSON.stringify(updates.embedding));
    }
    if (updates.metadata !== undefined) {
      setParts.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(updates.metadata));
    }

    if (setParts.length === 0) {
      return this.getEmbedding(id);
    }

    values.push(id);
    const query = `
      UPDATE app.embeddings
      SET ${setParts.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, content_type, content_id, title, content, embedding, metadata, created_at, updated_at
    `;

    try {
      const result = await database.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        contentType: row.content_type,
        contentId: row.content_id,
        title: row.title,
        content: row.content,
        embedding: JSON.parse(row.embedding),
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error('Failed to update embedding', { error, id, updates });
      throw error;
    }
  }

  async deleteEmbedding(id: string): Promise<boolean> {
    const query = 'DELETE FROM app.embeddings WHERE id = $1';

    try {
      const result = await database.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Failed to delete embedding', { error, id });
      throw error;
    }
  }

  async similaritySearch(
    queryEmbedding: number[],
    options: SimilaritySearchOptions = {}
  ): Promise<SimilarityResult[]> {
    const { limit = 10, threshold = 0.7, contentType, metadata } = options;

    let whereClause = '1=1';
    const queryParams = [JSON.stringify(queryEmbedding), threshold, limit];
    let paramCount = 4;

    if (contentType) {
      whereClause += ` AND content_type = $${paramCount++}`;
      queryParams.push(contentType);
    }

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        whereClause += ` AND metadata->>'${key}' = $${paramCount++}`;
        queryParams.push(value);
      });
    }

    const query = `
      SELECT
        id, content_type, content_id, title, content, embedding, metadata,
        created_at, updated_at,
        1 - (embedding <=> $1::vector) as similarity
      FROM app.embeddings
      WHERE ${whereClause} AND (1 - (embedding <=> $1::vector)) > $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    `;

    try {
      const result = await database.query(query, queryParams);

      return result.rows.map((row: any) => ({
        id: row.id,
        contentType: row.content_type,
        contentId: row.content_id,
        title: row.title,
        content: row.content,
        embedding: JSON.parse(row.embedding),
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        similarity: parseFloat(row.similarity),
      }));
    } catch (error) {
      logger.error('Failed to perform similarity search', { error, options });
      throw error;
    }
  }

  async batchCreateEmbeddings(
    inputs: EmbeddingInput[]
  ): Promise<EmbeddingRecord[]> {
    if (inputs.length === 0) {
      return [];
    }

    const values: any[] = [];
    const valuePlaceholders: string[] = [];

    inputs.forEach((input, index) => {
      const offset = index * 6;
      valuePlaceholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${
          offset + 5
        }, $${offset + 6})`
      );
      values.push(
        input.contentType,
        input.contentId,
        input.title,
        input.content,
        JSON.stringify(input.embedding),
        JSON.stringify(input.metadata || {})
      );
    });

    const query = `
      INSERT INTO app.embeddings (content_type, content_id, title, content, embedding, metadata)
      VALUES ${valuePlaceholders.join(', ')}
      RETURNING id, content_type, content_id, title, content, embedding, metadata, created_at, updated_at
    `;

    try {
      const result = await database.query(query, values);

      return result.rows.map((row: any) => ({
        id: row.id,
        contentType: row.content_type,
        contentId: row.content_id,
        title: row.title,
        content: row.content,
        embedding: JSON.parse(row.embedding),
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      logger.error('Failed to batch create embeddings', {
        error,
        count: inputs.length,
      });
      throw error;
    }
  }
}

export const vectorService = new VectorService();
export default vectorService;
