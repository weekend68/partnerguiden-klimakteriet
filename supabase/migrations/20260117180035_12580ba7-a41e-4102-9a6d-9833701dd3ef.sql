-- Create article_faqs table for FAQ schema support
CREATE TABLE public.article_faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.article_faqs ENABLE ROW LEVEL SECURITY;

-- Everyone can read FAQs (public content)
CREATE POLICY "Anyone can view article FAQs"
ON public.article_faqs
FOR SELECT
USING (true);

-- Only admins can insert FAQs
CREATE POLICY "Admins can insert article FAQs"
ON public.article_faqs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update FAQs
CREATE POLICY "Admins can update article FAQs"
ON public.article_faqs
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete FAQs
CREATE POLICY "Admins can delete article FAQs"
ON public.article_faqs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_article_faqs_updated_at
BEFORE UPDATE ON public.article_faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_article_faqs_article_id ON public.article_faqs(article_id);