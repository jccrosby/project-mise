export const config = {
  port: process.env.PORT || 3001,
  wsPort: process.env.WS_PORT || 3001,
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  dbPath: process.env.DB_PATH || './ai_contexts.db',
  contextCleanupInterval: 5 * 60 * 1000, // 5 minutes
  contextExpiryTime: 30 * 60 * 1000, // 30 minutes
  maxContextMessages: 10,
  maxTokensPerContext: 2048,
} as const;
