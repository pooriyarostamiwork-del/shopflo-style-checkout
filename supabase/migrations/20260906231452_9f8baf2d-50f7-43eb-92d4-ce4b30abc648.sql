DROP INDEX IF EXISTS pet_products_embedding_idx;
ALTER TABLE public.pet_products DROP COLUMN embedding;
ALTER TABLE public.pet_products ADD COLUMN embedding vector(384);
CREATE INDEX pet_products_embedding_idx ON public.pet_products USING hnsw (embedding vector_cosine_ops);