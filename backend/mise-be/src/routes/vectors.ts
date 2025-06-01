import { Request, Response, Router } from 'express';
import {
  vectorService,
  EmbeddingInput,
  SimilaritySearchOptions,
} from '../services/database/vector-service';
import { logger } from '../services/logger';

const router: Router = Router();

// Create a new embedding
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: EmbeddingInput = req.body;

    // Validate required fields
    if (!input.contentType || !input.content || !input.embedding) {
      return res.status(400).json({
        error: 'Missing required fields: contentType, content, embedding',
      });
    }

    const embedding = await vectorService.createEmbedding(input);

    res.status(201).json({
      success: true,
      data: embedding,
    });
  } catch (error) {
    logger.error('Failed to create embedding', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Get embedding by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const embedding = await vectorService.getEmbedding(id);

    if (!embedding) {
      return res.status(404).json({
        error: 'Embedding not found',
      });
    }

    res.json({
      success: true,
      data: embedding,
    });
  } catch (error) {
    logger.error('Failed to get embedding', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Update embedding
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const embedding = await vectorService.updateEmbedding(id, updates);

    if (!embedding) {
      return res.status(404).json({
        error: 'Embedding not found',
      });
    }

    res.json({
      success: true,
      data: embedding,
    });
  } catch (error) {
    logger.error('Failed to update embedding', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Delete embedding
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await vectorService.deleteEmbedding(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Embedding not found',
      });
    }

    res.json({
      success: true,
      message: 'Embedding deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete embedding', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Similarity search
router.post('/search', async (req: Request, res: Response) => {
  try {
    const {
      embedding,
      ...options
    }: { embedding: number[] } & SimilaritySearchOptions = req.body;

    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({
        error: 'Missing or invalid embedding array',
      });
    }

    const results = await vectorService.similaritySearch(embedding, options);

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    logger.error('Failed to perform similarity search', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Batch create embeddings
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { embeddings }: { embeddings: EmbeddingInput[] } = req.body;

    if (!embeddings || !Array.isArray(embeddings)) {
      return res.status(400).json({
        error: 'Missing or invalid embeddings array',
      });
    }

    const results = await vectorService.batchCreateEmbeddings(embeddings);

    res.status(201).json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    logger.error('Failed to batch create embeddings', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

export default router;
