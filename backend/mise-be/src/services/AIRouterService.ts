import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from './DatabaseService';
import { OllamaService } from './OllamaService';
import {
  ConversationMessage,
  ConversationContext,
  ActiveContext,
  ModelType,
  ChatRequest,
} from '../types';
import { config } from '../config';

export class AIRouterService {
  private activeContexts = new Map<string, ActiveContext>();
  private dbService: DatabaseService;
  private ollamaService: OllamaService;
  private cleanupInterval!: NodeJS.Timeout;

  constructor() {
    this.dbService = new DatabaseService();
    this.ollamaService = new OllamaService();
    this.startContextCleanup();
  }

  async getOrCreateContext(contextId: string): Promise<ActiveContext> {
    let context = this.activeContexts.get(contextId);
    // Check memory first
    if (context) {
      context.lastAccessed = new Date();
      return context;
    }

    // Load from database
    const storedContext = this.dbService.loadContext(contextId);

    if (storedContext) {
      context = {
        ...storedContext,
        lastAccessed: new Date(),
        isDirty: false,
      };
    } else {
      const now = new Date();
      context = {
        id: contextId,
        messages: [],
        metadata: {},
        createdAt: now,
        updatedAt: now,
        lastAccessed: now,
        isDirty: true,
      };
    }

    this.activeContexts.set(contextId, context);
    return context;
  }

  // New REST API methods
  async listAvailableModels(): Promise<string[]> {
    return this.ollamaService.listModels();
  }

  async getAllContexts(): Promise<ConversationContext[]> {
    const db = this.dbService as any;
    const contextRows = db.db
      .prepare('SELECT * FROM contexts ORDER BY updated_at DESC')
      .all();

    const contexts: ConversationContext[] = [];
    for (const row of contextRows) {
      const context = this.dbService.loadContext(row.id);
      if (context) {
        contexts.push(context);
      }
    }
    return contexts;
  }

  async getContext(contextId: string): Promise<ConversationContext | null> {
    // Check active contexts first
    const activeContext = this.activeContexts.get(contextId);
    if (activeContext) {
      return {
        id: activeContext.id,
        messages: activeContext.messages,
        domain: activeContext.domain,
        metadata: activeContext.metadata,
        createdAt: activeContext.createdAt,
        updatedAt: activeContext.updatedAt,
      };
    }

    // Load from database
    return this.dbService.loadContext(contextId);
  }

  async deleteContext(contextId: string): Promise<void> {
    // Remove from active contexts
    this.activeContexts.delete(contextId);

    // Delete from database
    const db = this.dbService as any;
    const deleteMessages = db.db.prepare(
      'DELETE FROM messages WHERE context_id = ?'
    );
    const deleteContext = db.db.prepare('DELETE FROM contexts WHERE id = ?');

    deleteMessages.run(contextId);
    deleteContext.run(contextId);
  }

  async createContext(domain?: string): Promise<ConversationContext> {
    const contextId = uuidv4();
    const now = new Date();

    // Convert string domain to proper type or null
    const validDomain:
      | 'coding'
      | 'general'
      | 'mlb'
      | 'cooking'
      | 'fitness'
      | null =
      domain &&
      ['coding', 'general', 'mlb', 'cooking', 'fitness'].includes(domain)
        ? (domain as 'coding' | 'general' | 'mlb' | 'cooking' | 'fitness')
        : null;

    const context: ConversationContext = {
      id: contextId,
      messages: [],
      domain: validDomain,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    // Save to database immediately
    this.dbService.saveContext(context);

    return context;
  }

  classifyQuery(query: string, context: ActiveContext): string {
    const lowerQuery = query.toLowerCase();

    // Simple keyword-based classification
    const patterns = {
      coding: [
        'javascript',
        'typescript',
        'code',
        'function',
        'debug',
        'api',
        'react',
        'node',
      ],
      mlb: ['baseball', 'mlb', 'stats', 'game', 'player', 'pitch', 'batting'],
      cooking: ['recipe', 'cook', 'ingredient', 'kitchen', 'food', 'chef'],
      fitness: [
        'workout',
        'exercise',
        'kettlebell',
        'fitness',
        'training',
        'gym',
      ],
    };

    for (const [domain, keywords] of Object.entries(patterns)) {
      if (keywords.some((keyword) => lowerQuery.includes(keyword))) {
        return domain;
      }
    }

    // Use context domain if no specific domain detected
    return context.domain || 'general';
  }

  selectModel(domain: string, queryLength: number): ModelType {
    // Smart model selection based on domain and complexity
    if (domain === 'coding') {
      return 'codellama:7b-instruct';
    }

    if (queryLength > 1000 || domain === 'complex') {
      return 'mistral:7b-instruct';
    }

    return 'llama3.2:3b'; // Default fast model
  }

  buildContextualPrompt(
    query: string,
    context: ActiveContext,
    domain: string
  ): string {
    const systemPrompts = {
      coding:
        'You are an expert TypeScript/JavaScript developer. Provide accurate, production-ready code solutions.',
      mlb: 'You are knowledgeable about baseball and MLB. Provide accurate statistics and insights.',
      cooking:
        'You are an experienced chef. Provide practical cooking advice and recipes.',
      fitness:
        'You are a fitness expert specializing in kettlebells and strength training.',
      general:
        'You are a helpful AI assistant. Provide accurate and useful information.',
    };

    const systemPrompt =
      systemPrompts[domain as keyof typeof systemPrompts] ||
      systemPrompts.general;

    // Get recent messages for context (limit tokens)
    const recentMessages = this.compressContext(
      context.messages,
      config.maxTokensPerContext
    );
    const contextString = recentMessages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    return `${systemPrompt}\n\n${
      contextString ? `Previous conversation:\n${contextString}\n\n` : ''
    }User: ${query}\nAssistant:`;
  }

  private compressContext(
    messages: ConversationMessage[],
    maxTokens: number
  ): ConversationMessage[] {
    // Simple token estimation: ~4 chars per token
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);

    let totalTokens = 0;
    const result: ConversationMessage[] = [];

    // Work backwards from most recent messages
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = estimateTokens(message.content);

      if (totalTokens + messageTokens > maxTokens && result.length > 0) {
        break;
      }

      result.unshift(message);
      totalTokens += messageTokens;
    }

    return result;
  }

  async processRequest(
    request: ChatRequest
  ): Promise<{ context: ActiveContext; model: ModelType; prompt: string }> {
    const context = await this.getOrCreateContext(request.contextId);
    const domain = this.classifyQuery(request.query, context);
    const model =
      (request.model as ModelType) ||
      this.selectModel(domain, request.query.length);
    const prompt = this.buildContextualPrompt(request.query, context, domain);

    // Add user message to context
    const userMessage: ConversationMessage = {
      id: uuidv4(),
      role: 'user',
      content: request.query,
      timestamp: new Date(),
      domain,
    };

    context.messages.push(userMessage);
    context.domain = domain as any;
    context.updatedAt = new Date();
    context.isDirty = true;

    return { context, model, prompt };
  }

  updateContextWithResponse(
    context: ActiveContext,
    response: string,
    model: ModelType
  ): void {
    const assistantMessage: ConversationMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      model,
      domain: context.domain,
    };

    context.messages.push(assistantMessage);
    context.updatedAt = new Date();
    context.isDirty = true;
  }

  async generateStream(
    model: ModelType,
    prompt: string
  ): Promise<ReadableStream> {
    return this.ollamaService.generateStream(model, prompt);
  }

  async generate(model: ModelType, prompt: string): Promise<string> {
    return this.ollamaService.generate(model, prompt);
  }

  private startContextCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = new Date();

      for (const [id, context] of this.activeContexts.entries()) {
        const age = now.getTime() - context.lastAccessed.getTime();

        // Save dirty contexts
        if (context.isDirty) {
          this.dbService.saveContext(context);
          context.isDirty = false;
        }

        // Remove expired contexts from memory
        if (age > config.contextExpiryTime) {
          this.activeContexts.delete(id);
        }
      }
    }, config.contextCleanupInterval);
  }

  async shutdown(): Promise<void> {
    clearInterval(this.cleanupInterval);

    // Save all dirty contexts
    for (const context of this.activeContexts.values()) {
      if (context.isDirty) {
        this.dbService.saveContext(context);
      }
    }

    this.dbService.close();
  }
}
