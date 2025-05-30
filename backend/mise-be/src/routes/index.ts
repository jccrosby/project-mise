import { Router, Request, Response } from 'express';
import { AIRouterService } from '../services/AIRouterService';
import { ChatRequest, ChatResponse } from '../types';

const router: Router = Router();
const aiRouter = new AIRouterService();

// API Info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Mise AI API',
    version: '1.0.0',
    description: 'Personal AI API wrapper for consistent access across devices',
    endpoints: {
      models: 'GET /api/models - List available AI models',
      chat: 'POST /api/chat - Send chat message (non-streaming)',
      chatStream: 'POST /api/chat/stream - Send chat message (streaming)',
      contexts: 'GET /api/contexts - List conversation contexts',
      context: 'GET /api/contexts/:id - Get specific context',
      deleteContext: 'DELETE /api/contexts/:id - Delete context',
    },
  });
});

// List available models
router.get('/models', async (req, res) => {
  try {
    const models = await aiRouter.listAvailableModels();
    res.json({ models });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch models',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Non-streaming chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { query, contextId, model }: ChatRequest = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!contextId) {
      return res.status(400).json({ error: 'Context ID is required' });
    }

    const request: ChatRequest = {
      query,
      contextId,
      model,
      stream: false,
    };

    const {
      context,
      model: selectedModel,
      prompt,
    } = await aiRouter.processRequest(request);
    const response = await aiRouter.generate(selectedModel, prompt);

    // Update context with the response
    aiRouter.updateContextWithResponse(context, response, selectedModel);

    const chatResponse: ChatResponse = {
      type: 'complete',
      response,
      model: selectedModel,
      contextId,
    };

    res.json(chatResponse);
  } catch (error) {
    res.status(500).json({
      error: 'Chat request failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Streaming chat endpoint
router.post('/chat/stream', async (req, res) => {
  try {
    const { query, contextId, model }: ChatRequest = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!contextId) {
      return res.status(400).json({ error: 'Context ID is required' });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    const request: ChatRequest = {
      query,
      contextId,
      model,
      stream: true,
    };

    const {
      context,
      model: selectedModel,
      prompt,
    } = await aiRouter.processRequest(request);

    // Send start event
    res.write(
      `data: ${JSON.stringify({
        type: 'started',
        contextId,
        model: selectedModel,
      })}\n\n`
    );

    let fullResponse = '';
    const stream = await aiRouter.generateStream(selectedModel, prompt);
    const reader = stream.getReader();

    try {
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

              // Send chunk event
              res.write(
                `data: ${JSON.stringify({
                  type: 'chunk',
                  chunk: data.response,
                  model: selectedModel,
                  done: data.done,
                })}\n\n`
              );
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }

      // Update context with complete response
      aiRouter.updateContextWithResponse(context, fullResponse, selectedModel);

      // Send completion event
      res.write(`data: ${JSON.stringify({ type: 'complete', contextId })}\n\n`);
      res.end();
    } catch (streamError) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error:
            streamError instanceof Error
              ? streamError.message
              : 'Stream processing error',
        })}\n\n`
      );
      res.end();
    }
  } catch (error) {
    res.status(500).json({
      error: 'Streaming chat request failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// List conversation contexts
router.get('/contexts', async (req, res) => {
  try {
    const contexts = await aiRouter.getAllContexts();
    res.json({ contexts });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch contexts',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get specific context
router.get('/contexts/:id', async (req, res) => {
  try {
    const contextId = req.params.id;
    const context = await aiRouter.getContext(contextId);

    if (!context) {
      return res.status(404).json({ error: 'Context not found' });
    }

    res.json({ context });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch context',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete context
router.delete('/contexts/:id', async (req, res) => {
  try {
    const contextId = req.params.id;
    await aiRouter.deleteContext(contextId);
    res.json({ message: 'Context deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete context',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create new context
router.post('/contexts', async (req, res) => {
  try {
    const { domain } = req.body;
    const context = await aiRouter.createContext(domain);
    res.status(201).json({ context });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create context',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as apiRoutes };
