-- Add article_id column to user_progress
ALTER TABLE public.user_progress ADD COLUMN article_id uuid;

-- Populate article_id from existing article_slug data
UPDATE public.user_progress up
SET article_id = a.id
FROM public.articles a
WHERE up.article_slug = a.slug;

-- Make article_id NOT NULL and add foreign key
ALTER TABLE public.user_progress 
  ALTER COLUMN article_id SET NOT NULL,
  ADD CONSTRAINT fk_user_progress_article 
    FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE;

-- Drop the old article_slug column
ALTER TABLE public.user_progress DROP COLUMN article_slug;

-- Add unique constraint to prevent duplicate progress entries
ALTER TABLE public.user_progress 
  ADD CONSTRAINT unique_user_article_progress UNIQUE (user_id, article_id);