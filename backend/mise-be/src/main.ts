import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { AIRouterService } from './services/AIRouterService';
import { ChatRequest, ChatResponse } from './types';
import { config } from './config';
import { apiRoutes } from './routes';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initialize services
const aiRouter = new AIRouterService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api', apiRoutes);

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (data) => {
    try {
      const request: ChatRequest = JSON.parse(data.toString());
      await handleChatRequest(ws, request);
    } catch (error) {
      const errorResponse: ChatResponse = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      ws.send(JSON.stringify(errorResponse));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

async function handleChatRequest(ws: any, request: ChatRequest): Promise<void> {
  const startResponse: ChatResponse = {
    type: 'started',
    contextId: request.contextId,
  };
  ws.send(JSON.stringify(startResponse));

  const { context, model, prompt } = await aiRouter.processRequest(request);

  if (request.stream !== false) {
    await handleStreamingResponse(
      ws,
      model,
      prompt,
      context,
      request.contextId
    );
  } else {
    await handleNonStreamingResponse(
      ws,
      model,
      prompt,
      context,
      request.contextId
    );
  }
}

async function handleStreamingResponse(
  ws: any,
  model: any,
  prompt: string,
  context: any,
  contextId: string
): Promise<void> {
  let fullResponse = '';

  try {
    const stream = await aiRouter.generateStream(model, prompt);
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            fullResponse += data.response;

            const chunkResponse: ChatResponse = {
              type: 'chunk',
              chunk: data.response,
              model,
              done: data.done,
            };
            ws.send(JSON.stringify(chunkResponse));
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }

    // Update context with complete response
    aiRouter.updateContextWithResponse(context, fullResponse, model);

    const completeResponse: ChatResponse = {
      type: 'complete',
      contextId,
    };
    ws.send(JSON.stringify(completeResponse));
  } catch (error) {
    const errorResponse: ChatResponse = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Stream processing error',
    };
    ws.send(JSON.stringify(errorResponse));
  }
}

async function handleNonStreamingResponse(
  ws: any,
  model: any,
  prompt: string,
  context: any,
  contextId: string
): Promise<void> {
  try {
    const response = await aiRouter.generate(model, prompt);
    aiRouter.updateContextWithResponse(context, response, model);

    const completeResponse: ChatResponse = {
      type: 'complete',
      response,
      model,
      contextId,
    };
    ws.send(JSON.stringify(completeResponse));
  } catch (error) {
    const errorResponse: ChatResponse = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Generation error',
    };
    ws.send(JSON.stringify(errorResponse));
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await aiRouter.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(config.port, () => {
  console.log(`AI Router server running on port ${config.port}`);
  console.log(`WebSocket server running on port ${config.port}`);
});
