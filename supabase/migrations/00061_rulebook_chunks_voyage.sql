-- Switch from OpenAI (1536 dims) to Voyage AI (1024 dims)
-- Table is empty, so safe to drop and recreate

DROP INDEX IF EXISTS rulebook_chunks_embedding_idx;
DROP FUNCTION IF EXISTS match_rulebook_chunks;

ALTER TABLE public.rulebook_chunks
  ALTER COLUMN embedding TYPE vector(1024);

-- Recreate HNSW index for new dimension
CREATE INDEX rulebook_chunks_embedding_idx
  ON public.rulebook_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Recreate RPC function with new dimension
CREATE OR REPLACE FUNCTION match_rulebook_chunks(
  query_embedding vector(1024),
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
