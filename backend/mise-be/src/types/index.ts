export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  domain?: string;
}

export interface ConversationContext {
  id: string;
  messages: ConversationMessage[];
  domain?: 'coding' | 'general' | 'mlb' | 'cooking' | 'fitness' | null;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveContext extends ConversationContext {
  lastAccessed: Date;
  isDirty: boolean;
}

export interface ChatRequest {
  query: string;
  contextId: string;
  stream?: boolean;
  model?: string;
}

export interface ChatResponse {
  type: 'started' | 'chunk' | 'complete' | 'error';
  contextId?: string;
  chunk?: string;
  response?: string;
  model?: string;
  error?: string;
  done?: boolean;
}

export type ModelType =
  | 'llama3.2:3b'
  | 'mistral:7b-instruct'
  | 'codellama:7b-instruct';

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}
