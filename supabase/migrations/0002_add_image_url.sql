-- Migration: Add image_url to faqs and update similarity search RPC

-- 1. Add image_url column to faqs table
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Update match_faqs function to include image_url in output
CREATE OR REPLACE FUNCTION match_faqs (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id BIGINT,
  question TEXT,
  answer TEXT,
  image_url TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    faqs.id,
    faqs.question,
    faqs.answer,
    faqs.image_url,
    1 - (faqs.embedding <=> query_embedding) AS similarity
  FROM faqs
  WHERE 1 - (faqs.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
