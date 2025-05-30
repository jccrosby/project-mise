# Mise AI API - Personal AI Wrapper

A Node.js API wrapper that provides consistent access to your personal AI services (Ollama with Llama 3.2 and Mistral) across all your devices.

## Overview

This API wrapper implements **item 2** from your Personal AI Project Roadmap: "Create a simple Node.js API wrapper for consistent access across your devices."

### Features

- ✅ RESTful API endpoints for AI interactions
- ✅ WebSocket support for real-time streaming
- ✅ Context management with SQLite persistence
- ✅ Domain-specific model selection (coding, cooking, fitness, etc.)
- ✅ Multi-device access support
- ✅ Local Ollama integration
- ✅ Error handling and validation

## API Endpoints

### Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `http://your-server:3001/api`

### Available Endpoints

#### GET `/` - API Information

Returns API metadata and available endpoints.

#### GET `/models` - List Available Models

```json
{
  "models": ["llama3.2:3b", "mistral:7b-instruct", "codellama:7b-instruct"]
}
```

#### POST `/chat` - Send Chat Message (Non-streaming)

Send a chat message and receive a complete response.

**Request:**

```json
{
  "query": "How do I implement error handling in TypeScript?",
  "contextId": "unique-session-id",
  "model": "codellama:7b-instruct"
}
```

**Response:**

```json
{
  "type": "complete",
  "response": "To implement error handling in TypeScript...",
  "model": "codellama:7b-instruct",
  "contextId": "unique-session-id"
}
```

#### POST `/chat/stream` - Send Chat Message (Streaming)

Send a chat message and receive a streaming response using Server-Sent Events.

**Request:** Same as `/chat`

**Response:** Server-Sent Events stream

```
data: {"type":"started","contextId":"unique-session-id","model":"codellama:7b-instruct"}

data: {"type":"chunk","chunk":"To implement","model":"codellama:7b-instruct","done":false}

data: {"type":"chunk","chunk":" error handling","model":"codellama:7b-instruct","done":false}

data: {"type":"complete","contextId":"unique-session-id"}
```

#### GET `/contexts` - List Conversation Contexts

```json
{
  "contexts": [
    {
      "id": "context-id",
      "domain": "coding",
      "messages": [...],
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:05:00.000Z"
    }
  ]
}
```

#### GET `/contexts/:id` - Get Specific Context

Returns detailed information about a specific conversation context.

#### POST `/contexts` - Create New Context

```json
{
  "domain": "cooking"
}
```

#### DELETE `/contexts/:id` - Delete Context

Removes a conversation context and all associated messages.

## Domain-Specific Intelligence

The API automatically classifies queries and selects appropriate models:

- **Coding**: Uses `codellama:7b-instruct` for programming questions
- **General**: Uses `llama3.2:3b` for fast general responses
- **Complex**: Uses `mistral:7b-instruct` for longer, complex queries
- **MLB/Sports**: Domain-specific responses
- **Cooking**: Kitchen and recipe assistance
- **Fitness**: Workout and training advice

## Usage Examples

### 1. Desktop Application

```typescript
import { MiseAIClient } from './client-example';

const client = new MiseAIClient({
  baseUrl: 'http://localhost:3001',
});

// Get available models
const models = await client.getModels();

// Create a coding context
const context = await client.createContext('coding');

// Ask a question
const response = await client.chat({
  query: 'How do I implement a REST API in TypeScript?',
  contextId: context.id,
  model: 'codellama:7b-instruct',
});
```

### 2. Mobile App with Streaming

```typescript
const client = new MiseAIClient({
  baseUrl: 'http://your-home-server:3001',
});

const context = await client.createContext('general');

await client.chatStream(
  {
    query: "What's good for kettlebell training today?",
    contextId: context.id,
  },
  (chunk) => updateUI(chunk),
  () => console.log('Complete'),
  (error) => console.error('Error:', error)
);
```

### 3. Command Line Tool

```bash
# Set environment variable
export MISE_AI_URL=http://localhost:3001

# Use in CLI
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me a kettlebell workout",
    "contextId": "cli-session"
  }'
```

### 4. cURL Examples

**Get models:**

```bash
curl http://localhost:3001/api/models
```

**Chat request:**

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Explain async/await in TypeScript",
    "contextId": "test-session",
    "model": "codellama:7b-instruct"
  }'
```

**Streaming chat:**

```bash
curl -X POST http://localhost:3001/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the best kettlebell exercises?",
    "contextId": "fitness-session"
  }'
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3001)
- `OLLAMA_URL` - Ollama server URL (default: http://localhost:11434)
- `DB_PATH` - SQLite database path (default: ./ai_contexts.db)

### Smart Model Selection

The API automatically selects the best model based on:

- Query domain (detected via keywords)
- Query length and complexity
- Context history

## Cross-Device Access

This API wrapper enables consistent access across:

1. **Desktop Apps**: Direct HTTP/WebSocket connections
2. **Mobile Apps**: REST API with streaming support
3. **Web Dashboards**: Same-origin or CORS-enabled requests
4. **CLI Tools**: Simple HTTP requests with environment variables
5. **IoT Devices**: Lightweight HTTP endpoints
6. **Home Assistant**: RESTful integration

## Development

### Start the Server

```bash
# Development mode
nx serve mise-be

# Production build
nx build mise-be
nx start mise-be
```

### Testing

```bash
# Unit tests
nx test mise-be

# E2E tests
nx e2e mise-be-e2e
```

## Security Considerations

- **Local Network**: Designed for home network use
- **No Authentication**: Currently trust-based (add auth for external access)
- **Rate Limiting**: Consider implementing for production use
- **CORS**: Configure appropriately for web access

## Next Steps

1. **Authentication**: Add API keys or OAuth for secure access
2. **Rate Limiting**: Implement per-device/IP rate limits
3. **Caching**: Add response caching for common queries
4. **Health Monitoring**: Add metrics and health check endpoints
5. **Mobile SDK**: Create native mobile client libraries
6. **Web Components**: Build reusable web components for dashboards

## Integration with Roadmap

This API wrapper supports the following roadmap items:

- ✅ **Phase 1**: Personal Infrastructure - API wrapper complete
- 🔄 **Phase 1**: Daily Standup Assistant - Ready for integration
- 🔄 **Phase 1**: Code Review Buddy - Ready for integration
- 🔄 **Phase 1**: Meeting Transcriber - Ready for integration
- 🔄 **Phase 2**: Domain-specific intelligence - Foundation ready
- 🔄 **Phase 3**: Edge deployment - API ready for distributed deployment

## Troubleshooting

### Common Issues

1. **Ollama not running**: Ensure Ollama is started and models are pulled
2. **Port conflicts**: Check if port 3001 is available
3. **Database permissions**: Ensure write access to database path
4. **Model not found**: Verify model names with `ollama list`

### Health Check

```bash
curl http://localhost:3001/health
```

Should return:

```json
{
  "status": "ok",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```
