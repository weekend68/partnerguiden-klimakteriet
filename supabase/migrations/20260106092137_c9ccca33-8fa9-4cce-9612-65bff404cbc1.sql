-- Create articles table for CMS functionality
CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  meta_title text,
  meta_description text,
  excerpt text NOT NULL,
  content text NOT NULL,
  image_url text,
  image_alt text,
  image_filename text NOT NULL, -- Used for email images
  sort_order integer NOT NULL DEFAULT 0, -- Order in email sequence
  published_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Everyone can read articles (public content)
CREATE POLICY "Anyone can view articles"
ON public.articles
FOR SELECT
USING (true);

-- Only admins can insert articles
CREATE POLICY "Admins can insert articles"
ON public.articles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update articles
CREATE POLICY "Admins can update articles"
ON public.articles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete articles
CREATE POLICY "Admins can delete articles"
ON public.articles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for slug lookups
CREATE INDEX idx_articles_slug ON public.articles(slug);

-- Create index for sort order
CREATE INDEX idx_articles_sort_order ON public.articles(sort_order);