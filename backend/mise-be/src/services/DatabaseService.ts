import Database from 'better-sqlite3';
import { ConversationContext, ConversationMessage } from '../types';
import { config } from '../config';

export interface ContextRow extends ConversationContext {
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database(config.dbPath);
    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contexts (
        id TEXT PRIMARY KEY,
        domain TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        context_id TEXT,
        role TEXT,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        model TEXT,
        domain TEXT,
        FOREIGN KEY (context_id) REFERENCES contexts (id)
      );

      CREATE INDEX IF NOT EXISTS idx_contexts_updated ON contexts(updated_at);
      CREATE INDEX IF NOT EXISTS idx_messages_context ON messages(context_id, timestamp);
    `);
  }

  saveContext(context: ConversationContext): void {
    const contextStmt = this.db.prepare(`
      INSERT OR REPLACE INTO contexts (id, domain, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    contextStmt.run(
      context.id,
      context.domain || null,
      JSON.stringify(context.metadata),
      context.createdAt.toISOString(),
      context.updatedAt.toISOString()
    );

    // Save new messages
    const messageStmt = this.db.prepare(`
      INSERT OR REPLACE INTO messages (id, context_id, role, content, timestamp, model, domain)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const message of context.messages) {
      messageStmt.run(
        message.id,
        context.id,
        message.role,
        message.content,
        message.timestamp.toISOString(),
        message.model || null,
        message.domain || null
      );
    }
  }

  loadContext(contextId: string): ConversationContext | null {
    const contextRow: ContextRow = this.db
      .prepare('SELECT * FROM contexts WHERE id = ?')
      .get(contextId) as ContextRow;
    if (!contextRow) return null;

    const messageRows = this.db
      .prepare(
        `
      SELECT * FROM messages WHERE context_id = ? ORDER BY timestamp ASC
    `
      )
      .all(contextId);

    const messages: ConversationMessage[] = messageRows.map((row: any) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      timestamp: new Date(row.timestamp),
      model: row.model,
      domain: row.domain,
    }));

    return {
      id: contextId,
      messages,
      domain: contextRow.domain,
      metadata: contextRow.metadata || {},
      createdAt: new Date(contextRow.created_at),
      updatedAt: new Date(contextRow.updated_at),
    };
  }

  close(): void {
    this.db.close();
  }
}
