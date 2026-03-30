-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Rulebook chunks table for RAG-based rulebook chat
CREATE TABLE public.rulebook_chunks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book_slug text NOT NULL,
  book_title text NOT NULL,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  token_count integer NOT NULL DEFAULT 0,
  embedding vector(1536) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (book_slug, chunk_index)
);

-- Enable RLS
ALTER TABLE public.rulebook_chunks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Authenticated users can read rulebook chunks"
  ON public.rulebook_chunks
  FOR SELECT
  TO authenticated
  USING (true);

-- HNSW index for fast cosine similarity search
CREATE INDEX rulebook_chunks_embedding_idx
  ON public.rulebook_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index on book_slug for filtered queries
CREATE INDEX rulebook_chunks_book_slug_idx
  ON public.rulebook_chunks (book_slug);

-- RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_rulebook_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 8,
  filter_books text[] DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  book_slug text,
  book_title text,
  chunk_index integer,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.book_slug,
    rc.book_title,
    rc.chunk_index,
    rc.content,
    1 - (rc.embedding <=> query_embedding) AS similarity
  FROM public.rulebook_chunks rc
  WHERE
    (filter_books IS NULL OR rc.book_slug = ANY(filter_books))
    AND 1 - (rc.embedding <=> query_embedding) > match_threshold
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
