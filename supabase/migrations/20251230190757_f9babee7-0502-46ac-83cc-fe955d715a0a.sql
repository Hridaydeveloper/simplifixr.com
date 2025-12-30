-- Create table for Popular Categories section
CREATE TABLE public.popular_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  category_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.popular_categories ENABLE ROW LEVEL SECURITY;

-- Public can view active categories
CREATE POLICY "Anyone can view active popular categories"
  ON public.popular_categories
  FOR SELECT
  USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage popular categories"
  ON public.popular_categories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create table for All Services section
CREATE TABLE public.service_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sub_points TEXT[] DEFAULT ARRAY[]::TEXT[],
  icon_color TEXT DEFAULT 'text-primary',
  gradient TEXT DEFAULT 'from-primary/20 to-accent/20',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  category_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.service_sections ENABLE ROW LEVEL SECURITY;

-- Public can view active sections
CREATE POLICY "Anyone can view active service sections"
  ON public.service_sections
  FOR SELECT
  USING (is_active = true);

-- Admins can manage sections
CREATE POLICY "Admins can manage service sections"
  ON public.service_sections
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_popular_categories_updated_at
  BEFORE UPDATE ON public.popular_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_sections_updated_at
  BEFORE UPDATE ON public.service_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();