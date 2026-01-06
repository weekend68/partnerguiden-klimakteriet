import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Article {
  id: string;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  excerpt: string;
  content: string;
  image_url: string | null;
  image_alt: string | null;
  image_filename: string;
  sort_order: number;
  published_at: string | null;
  updated_at: string;
  created_at: string;
}

interface ArticleListProps {
  onEditArticle: (article: Article) => void;
}

export function ArticleList({ onEditArticle }: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      console.error("Error fetching articles:", err);
      toast.error("Kunde inte hämta artiklar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Inga artiklar i databasen</h3>
          <p className="text-muted-foreground mb-4">
            Artiklarna behöver seedas till databasen först.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          {articles.length} artiklar i databasen
        </h2>
        <Button variant="outline" onClick={fetchArticles} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Uppdatera
        </Button>
      </div>

      <div className="space-y-2">
        {articles.map((article) => (
          <Card
            key={article.id}
            className="hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onEditArticle(article)}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="shrink-0">
                      #{article.sort_order + 1}
                    </Badge>
                    <h3 className="font-medium truncate">{article.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {article.excerpt}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Slug: {article.slug} • Uppdaterad:{" "}
                    {new Date(article.updated_at).toLocaleDateString("sv-SE")}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 ml-4">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export type { Article };
