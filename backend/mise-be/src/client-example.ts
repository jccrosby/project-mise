/**
 * Example client for the Mise AI API
 * This demonstrates how to use the REST API wrapper consistently across different devices
 */

interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

interface ChatMessage {
  query: string;
  contextId: string;
  model?: string;
}

interface ChatResponse {
  type: 'started' | 'chunk' | 'complete' | 'error';
  contextId?: string;
  chunk?: string;
  response?: string;
  model?: string;
  error?: string;
  done?: boolean;
}

export class MiseAIClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Get available AI models
   */
  async getModels(): Promise<string[]> {
    const response = await fetch(`${this.config.baseUrl}/api/models`);
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    const data = await response.json();
    return data.models;
  }

  /**
   * Send a chat message (non-streaming)
   */
  async chat(message: ChatMessage): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.statusText}`);
    }

    const data: ChatResponse = (await response.json()) as ChatResponse;
    return data.response || '';
  }

  /**
   * Send a chat message with streaming response
   */
  async chatStream(
    message: ChatMessage,
    onChunk: (chunk: string) => void,
    onComplete?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body available');
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: ChatResponse = JSON.parse(line.slice(6));

              if (data.type === 'chunk' && data.chunk) {
                onChunk(data.chunk);
              } else if (data.type === 'complete') {
                onComplete?.();
              } else if (data.type === 'error') {
                onError?.(data.error || 'Unknown error');
              }
            } catch (e) {
              console.warn('Failed to parse streaming data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get all conversation contexts
   */
  async getContexts(): Promise<any[]> {
    const response = await fetch(`${this.config.baseUrl}/api/contexts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch contexts: ${response.statusText}`);
    }
    const data = await response.json();
    return data.contexts;
  }

  /**
   * Get a specific context by ID
   */
  async getContext(contextId: string): Promise<any> {
    const response = await fetch(
      `${this.config.baseUrl}/api/contexts/${contextId}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch context: ${response.statusText}`);
    }
    const data = await response.json();
    return data.context;
  }

  /**
   * Create a new conversation context
   */
  async createContext(domain?: string): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/api/contexts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create context: ${response.statusText}`);
    }
    const data = await response.json();
    return data.context;
  }

  /**
   * Delete a conversation context
   */
  async deleteContext(contextId: string): Promise<void> {
    const response = await fetch(
      `${this.config.baseUrl}/api/contexts/${contextId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete context: ${response.statusText}`);
    }
  }
}

// Example usage for different devices/scenarios:

// 1. Desktop app usage
export async function desktopExample() {
  const client = new MiseAIClient({
    baseUrl: 'http://localhost:3001',
  });

  // Get available models
  const models = await client.getModels();
  console.log('Available models:', models);

  // Create a new context for coding questions
  const context = await client.createContext('coding');

  // Send a coding question
  const response = await client.chat({
    query: 'How do I implement a REST API in TypeScript?',
    contextId: context.id,
    model: 'codellama:7b-instruct',
  });

  console.log('AI Response:', response);
}

// 2. Mobile app usage with streaming
export async function mobileExample() {
  const client = new MiseAIClient({
    baseUrl: 'http://your-home-server:3001',
  });

  const context = await client.createContext('general');

  let fullResponse = '';

  await client.chatStream(
    {
      query: "What's the weather like for fly fishing this weekend?",
      contextId: context.id,
    },
    (chunk) => {
      fullResponse += chunk;
      console.log('Chunk:', chunk);
    },
    () => {
      console.log('Complete response:', fullResponse);
    },
    (error) => {
      console.error('Stream error:', error);
    }
  );
}

// 3. Command line tool usage
export async function cliExample() {
  const client = new MiseAIClient({
    baseUrl: process.env.MISE_AI_URL || 'http://localhost:3001',
  });

  const contextId = 'cli-session-' + Date.now();

  // Quick question without creating a persistent context
  const response = await client.chat({
    query: process.argv[2] || 'Hello, world!',
    contextId,
  });

  console.log(response);
}

// 4. Web dashboard usage
export async function webDashboardExample() {
  const client = new MiseAIClient({
    baseUrl: '/api', // Relative URL when served from same origin
  });

  // Get all contexts for dashboard display
  const contexts = await client.getContexts();

  // Display recent conversations
  contexts.slice(0, 10).forEach((ctx) => {
    console.log(
      `Context: ${ctx.id}, Messages: ${ctx.messages.length}, Domain: ${ctx.domain}`
    );
  });
}
