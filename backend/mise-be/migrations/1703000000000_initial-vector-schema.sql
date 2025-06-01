-- Migration: Initial vector schema
-- Description: Create tables for storing vector embeddings and metadata

-- Create embeddings table for storing vector data
CREATE TABLE app.embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type VARCHAR(50) NOT NULL, -- 'document', 'code', 'comment', etc.
  content_id VARCHAR(255), -- External ID reference
  title TEXT,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension, adjust as needed
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient vector similarity search
CREATE INDEX embeddings_embedding_cosine_idx ON app.embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX embeddings_embedding_l2_idx ON app.embeddings
  USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- Create indexes for metadata queries
CREATE INDEX embeddings_content_type_idx ON app.embeddings (content_type);
CREATE INDEX embeddings_content_id_idx ON app.embeddings (content_id);
CREATE INDEX embeddings_created_at_idx ON app.embeddings (created_at);
CREATE INDEX embeddings_metadata_gin_idx ON app.embeddings USING GIN (metadata);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION app.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_embeddings_updated_at
  BEFORE UPDATE ON app.embeddings
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

-- Create document collections table for organizing related content
CREATE TABLE app.document_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for many-to-many relationship
CREATE TABLE app.embedding_collections (
  embedding_id UUID REFERENCES app.embeddings(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES app.document_collections(id) ON DELETE CASCADE,
  PRIMARY KEY (embedding_id, collection_id)
);

-- Create indexes for collections
CREATE INDEX document_collections_name_idx ON app.document_collections (name);
CREATE INDEX embedding_collections_embedding_idx ON app.embedding_collections (embedding_id);
CREATE INDEX embedding_collections_collection_idx ON app.embedding_collections (collection_id);

-- Add updated_at trigger for collections
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON app.document_collections
  FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();
