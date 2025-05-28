export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  domain?: string;
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

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export type ModelType =
  | 'llama3.2:3b'
  | 'mistral:7b-instruct'
  | 'codellama:7b-instruct';
