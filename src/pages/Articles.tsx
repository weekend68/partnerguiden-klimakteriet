import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, BookOpen, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  image_filename: string;
  image_alt: string | null;
}

const Articles = () => {
  const { user, signOut } = useAuth();
  const { getArticleProgress, articlesRead, quizzesCompleted, totalArticles, overallProgress } = useProgress();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useDocumentTitle("Alla artiklar – Partnerguiden: Klimakteriet");

  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, slug, title, excerpt, image_url, image_filename, image_alt")
        .order("sort_order", { ascending: true });

      if (!error && data) {
        setArticles(data);
      }
      setLoading(false);
    };

    fetchArticles();
  }, []);

  // Get image URL - prefer image_url from DB, fallback to public folder
  const getImageUrl = (article: Article) => {
    if (article.image_url) return article.image_url;
    return `/images/${article.image_filename}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-serif text-lg sm:text-xl font-semibold text-foreground leading-tight">
            <span className="sm:hidden">Partnerguiden:<br />Klimakteriet</span>
            <span className="hidden sm:inline">Partnerguiden: Klimakteriet</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-sm text-muted-foreground hidden md:inline">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/auth">
                  <User className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logga in</span>
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Progress Banner (if logged in) */}
      {user && (
        <div className="bg-primary/5 border-b border-primary/10 py-4">
          <div className="container">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-heading text-primary">{articlesRead}</p>
                  <p className="text-xs text-muted-foreground">av {totalArticles} artiklar</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-heading text-primary">{quizzesCompleted}</p>
                  <p className="text-xs text-muted-foreground">av {totalArticles} quiz</p>
                </div>
              </div>
              <div className="flex-1 max-w-xs">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Total framsteg</span>
                  <span className="font-medium text-foreground">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container py-12">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka till start
        </Link>

        <h1 className="font-serif text-3xl md:text-4xl font-medium mb-4">
          Alla {articles.length} artiklar
        </h1>
        <p className="text-muted-foreground mb-12 max-w-2xl">
          Läs artiklarna i ordning eller hoppa direkt till det ämne som känns mest relevant just nu.
          {!user && (
            <span className="block mt-2">
              <Link to="/auth" className="text-primary hover:underline">Logga in</Link> för att spara dina framsteg.
            </span>
          )}
        </p>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Laddar artiklar...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => {
              const progress = getArticleProgress(article.slug);
              const isRead = progress?.article_read;
              const quizDone = progress?.quiz_completed;

              return (
                <Link
                  key={article.id}
                  to={`/artikel/${article.slug}`}
                  className="group bg-card rounded-lg shadow-card overflow-hidden card-hover relative"
                >
                  {/* Progress indicators */}
                  {user && (isRead || quizDone) && (
                    <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                      {isRead && (
                        <div className="bg-primary/90 text-primary-foreground rounded-full p-1.5" title="Artikel läst">
                          <BookOpen className="h-3.5 w-3.5" />
                        </div>
                      )}
                      {quizDone && (
                        <div className="bg-primary/90 text-primary-foreground rounded-full p-1.5" title="Quiz klarat">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="aspect-[16/9] overflow-hidden">
                    <img 
                      src={getImageUrl(article)} 
                      alt={article.image_alt || article.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <div className="text-sm text-muted-foreground mb-2">
                      Artikel {index + 1} av {articles.length}
                    </div>
                    <h2 className="font-serif text-lg font-medium mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.excerpt}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Articles;