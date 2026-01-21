import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, BookOpen, CheckCircle, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";
import heroBackground from "@/assets/hero-background.jpg";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image_filename: string;
  image_url: string | null;
  image_alt: string | null;
}

const Index = () => {
  const { user } = useAuth();
  const { articlesRead, quizzesCompleted, totalArticles, overallProgress, getArticleProgress } = useProgress();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch articles from database in correct sort order
  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, slug, title, excerpt, image_filename, image_url, image_alt")
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error fetching articles:", error);
      } else {
        setArticles(data || []);
      }
      setLoading(false);
    };

    fetchArticles();
  }, []);

  // Find the next article to read (first one where quiz is not completed)
  const nextArticle = user
    ? articles.find((article) => {
        const progress = getArticleProgress(article.id);
        return !progress?.quiz_completed;
      }) || articles[0]
    : articles[0];

  const hasProgress = user && articlesRead > 0;
  const isFullyComplete = user && quizzesCompleted === totalArticles && totalArticles > 0;

  // Show loading state while fetching articles
  if (loading || !articles.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO url="/" />
      <Header />

      {/* Progress Banner (if logged in) */}
      {user && (
        <div className="bg-primary/5 border-b border-primary/10 py-4">
          <div className="container">
            <div className="flex flex-col gap-3">
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
                <div className="flex-1 max-w-xs w-full">
                  <div className="flex items-center justify-between text-sm mb-2 gap-4">
                    <span className="text-muted-foreground">Din kunskapsresa:</span>
                    <span className="font-medium text-foreground">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
              </div>
              {isFullyComplete ? (
                <div className="text-center sm:text-left">
                  <p className="text-sm">
                    <span className="font-medium text-primary">🎉 Grattis! Du har klarat hela kursen!</span>{" "}
                    <Link
                      to="/grattis"
                      className="text-primary hover:underline"
                    >
                      Se ditt diplom →
                    </Link>
                  </p>
                </div>
              ) : nextArticle && (
                <div className="text-center sm:text-left">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Nästa:</span>{" "}
                    <Link
                      to={`/artikel/${nextArticle.slug}`}
                      className="text-primary hover:underline truncate inline-block max-w-[250px] sm:max-w-none align-bottom"
                    >
                      {nextArticle.title}
                    </Link>
                    {getArticleProgress(nextArticle.id)?.article_read && (
                      <CheckCircle className="inline-block ml-1.5 h-4 w-4 text-primary align-text-bottom" />
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Background image - using img tag for LCP optimization */}
          <img
            src={heroBackground}
            alt=""
            fetchPriority="high"
            sizes="100vw"
            className="absolute inset-0 w-full h-full object-cover object-center"
            aria-hidden="true"
          />
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-background/75" />

          <div className="container max-w-4xl text-center relative z-10">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6 text-balance animate-fade-in">
              Bli en bättre partner under klimakteriet på två veckor
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-[720px] mx-auto animate-fade-in stagger-1">
              En gratis kurs skapad för dig som partner. Lär dig de biologiska sanningarna, undvik de vanligaste
              kommunikationsfällorna och stärk er relation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-2">
              <Button asChild size="lg" className="text-base">
                <Link to={`/artikel/${nextArticle.slug}`}>
                  {hasProgress ? "Fortsätt läsa nästa artikel" : "Börja här – läs första artikeln"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base bg-background/80 backdrop-blur-sm">
                <Link to="/artiklar">Se alla 13 artiklar</Link>
              </Button>
            </div>
            {!user && (
              <Link to="/auth" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-6 animate-fade-in stagger-3">
                Få kursen i din inbox – skapa ett gratis konto
              </Link>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center p-6 animate-fade-in stagger-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-serif text-xl font-medium mb-2">13 artiklar</h2>
                <p className="text-muted-foreground">
                  Väl genomtänkta texter som förklarar vad som händer och hur du kan stötta.
                </p>
              </div>
              <div className="text-center p-6 animate-fade-in stagger-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-serif text-xl font-medium mb-2">Quiz efter varje artikel</h2>
                <p className="text-muted-foreground">
                  Testa din förståelse med AI-genererade frågor. Försök igen hur många gånger du vill.
                </p>
              </div>
              <div className="text-center p-6 animate-fade-in stagger-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-serif text-xl font-medium mb-2">Stödjande ton</h2>
                <p className="text-muted-foreground">
                  Skrivet för partners, utan fackspråk. Fokus på förståelse och praktiska verktyg.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Preview Article */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-center mb-8">
              {hasProgress ? `Nästa artikel: ${nextArticle.title}` : `Första artikeln: ${nextArticle.title}`}
            </h2>
            <div className="bg-card rounded-lg shadow-card overflow-hidden">
              <img 
                src={nextArticle.image_url || `/images/${nextArticle.image_filename}`} 
                alt={nextArticle.image_alt || nextArticle.title} 
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 768px, 896px"
                loading="lazy"
                decoding="async"
                className="w-full h-64 object-cover" 
              />
              <div className="p-6 md:p-8">
                <p className="text-muted-foreground mb-6 text-lg">{nextArticle.excerpt}</p>
                <Button asChild>
                  <Link to={`/artikel/${nextArticle.slug}`}>
                    {hasProgress ? "Fortsätt läsa" : "Läs hela artikeln"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
