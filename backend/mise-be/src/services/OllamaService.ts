import { ModelType, OllamaRequest, OllamaResponse } from '../types';
import { config } from '../config';

export class OllamaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.ollamaUrl;
  }

  async generateStream(
    model: ModelType,
    prompt: string
  ): Promise<ReadableStream> {
    const request: OllamaRequest = {
      model,
      prompt,
      stream: true,
      options: {
        temperature: 0.7,
        top_p: 0.9,
      },
    };

    console.log(`*** OllamaService.generateStream: ${JSON.stringify(request)}`);
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      console.log(`*** Ollama API error: ${response.statusText}`);
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    if (!response.body) {
      console.log(`*** No response body from Ollama`);
      throw new Error('No response body from Ollama');
    }

    return response.body;
  }

  async generate(model: ModelType, prompt: string): Promise<string> {
    const request: OllamaRequest = {
      model,
      prompt,
      stream: false,
    };

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    return data.response;
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.warn('Could not fetch available models:', error);
      return [];
    }
  }
}
