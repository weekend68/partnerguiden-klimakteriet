import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getArticleBySlug, articles } from "@/data/articles";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, BookCheck, CheckCircle, User, LogOut } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";

const Article = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { getArticleProgress, markArticleRead, articlesRead, quizzesCompleted, totalArticles, overallProgress } = useProgress();
  
  const article = slug ? getArticleBySlug(slug) : undefined;
  const progress = slug ? getArticleProgress(slug) : null;

  // Mark article as read when user scrolls to bottom
  useEffect(() => {
    if (!user || !slug || progress?.article_read) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      
      // Mark as read when scrolled 80% of the page
      if (scrollPosition >= pageHeight * 0.8) {
        markArticleRead(slug);
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user, slug, progress?.article_read, markArticleRead]);

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl mb-4">Artikeln hittades inte</h1>
          <Button asChild>
            <Link to="/artiklar">Se alla artiklar</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentIndex = articles.findIndex(a => a.id === article.id);
  const nextArticle = articles[currentIndex + 1];
  const prevArticle = articles[currentIndex - 1];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-serif text-xl font-semibold text-foreground">
            Relateify
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/artiklar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Alla artiklar
            </Link>
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/auth">
                  <User className="h-4 w-4 mr-2" />
                  Logga in
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Progress Banner (if logged in) */}
      {user && (
        <div className="bg-primary/5 border-b border-primary/10 py-3">
          <div className="container">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  {articlesRead}/{totalArticles} artiklar
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {quizzesCompleted}/{totalArticles} quiz
                </span>
              </div>
              <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                <Progress value={overallProgress} className="h-2" />
                <span className="text-sm font-medium text-foreground">{overallProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Article Header Image */}
      <div className="w-full h-64 md:h-80 lg:h-96 overflow-hidden relative">
        <img 
          src={article.imageUrl} 
          alt={article.imageAlt}
          className="w-full h-full object-cover"
        />
        {/* Progress badges */}
        {user && (progress?.article_read || progress?.quiz_completed) && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            {progress?.article_read && (
              <div className="bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-sm font-medium flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                Läst
              </div>
            )}
            {progress?.quiz_completed && (
              <div className="bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-sm font-medium flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                Quiz klarat ({progress.quiz_score}/3)
              </div>
            )}
          </div>
        )}
      </div>

      <main className="container max-w-3xl py-12">
        <Link to="/artiklar" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Alla artiklar
        </Link>

        <div className="text-sm text-muted-foreground mb-4">
          Artikel {currentIndex + 1} av 13
        </div>

        <h1 className="font-serif text-3xl md:text-4xl font-medium mb-6 text-balance">
          {article.title}
        </h1>

        {/* Article Content */}
        <article className="prose-relateify text-lg leading-relaxed">
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 className="font-serif text-2xl font-semibold mt-10 mb-4 text-foreground">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="font-serif text-xl font-medium mt-8 mb-3 text-foreground">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-5 text-foreground/90">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic">{children}</em>
              ),
              ul: ({ children }) => (
                <ul className="my-5 pl-6 space-y-2 list-disc">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-5 pl-6 space-y-2 list-decimal">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-foreground/90">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary/30 pl-5 my-6 italic text-muted-foreground">{children}</blockquote>
              ),
              a: ({ href, children }) => (
                <a href={href} className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>
              ),
              hr: () => <hr className="my-8 border-border" />,
            }}
          >
            {article.content}
          </ReactMarkdown>
        </article>

        {/* Login prompt if not logged in */}
        {!user && (
          <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border text-center">
            <p className="text-muted-foreground text-sm">
              <Link to="/auth" className="text-primary hover:underline">Logga in</Link> för att spara dina framsteg och se vilka artiklar du har läst.
            </p>
          </div>
        )}

        {/* Quiz CTA */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-medium mb-2">
                {progress?.quiz_completed ? "Quiz avklarat!" : "Testa din förståelse"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {progress?.quiz_completed 
                  ? `Du fick ${progress.quiz_score} av 3 rätt. Vill du försöka igen?`
                  : "Ta ett kort quiz med 3 frågor baserat på artikeln du just läst."
                }
              </p>
              <Button onClick={() => navigate(`/quiz/${article.slug}`)}>
                {progress?.quiz_completed ? "Ta quiz igen" : "Ta quiz"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-between">
          {prevArticle ? (
            <Link
              to={`/artikel/${prevArticle.slug}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Föregående: {prevArticle.title}</span>
            </Link>
          ) : <div />}
          {nextArticle && (
            <Link
              to={`/artikel/${nextArticle.slug}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors sm:text-right"
            >
              <span className="text-sm">Nästa: {nextArticle.title}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
};

export default Article;
