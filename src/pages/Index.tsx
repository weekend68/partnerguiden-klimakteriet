import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { articles } from "@/data/articles";
import { ArrowRight, BookOpen, CheckCircle, Heart, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { Progress } from "@/components/ui/progress";

const Index = () => {
  const { user, signOut } = useAuth();
  const { articlesRead, quizzesCompleted, totalArticles, overallProgress } = useProgress();
  const firstArticle = articles[0];

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
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
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

      {/* Progress Banner (if logged in and has progress) */}
      {user && overallProgress > 0 && (
        <div className="bg-primary/5 border-b border-primary/10 py-4">
          <div className="container">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-heading text-primary">{articlesRead}</p>
                  <p className="text-xs text-muted-foreground">artiklar lästa</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-heading text-primary">{quizzesCompleted}</p>
                  <p className="text-xs text-muted-foreground">quiz klarade</p>
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

      {/* Hero Section */}
      <section className="bg-hero-gradient py-20 md:py-32">
        <div className="container max-w-4xl text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6 text-balance animate-fade-in">
            Lär dig förstå klimakteriet på 10 dagar
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in stagger-1">
            En gratis kurs som hjälper dig stötta din partner genom klimakteriet.
            Ingen föranmälan. Inga dolda kostnader. Bara kunskap som gör skillnad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-2">
            <Button asChild size="lg" className="text-base">
              <Link to={`/artikel/${firstArticle.slug}`}>
                Börja här – läs första artikeln
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link to="/artiklar">
                Se alla 13 artiklar
              </Link>
            </Button>
          </div>
          {!user && (
            <p className="text-sm text-muted-foreground mt-6 animate-fade-in stagger-3">
              <Link to="/auth" className="text-primary hover:underline">Logga in</Link> för att spara din framsteg
            </p>
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
              <h3 className="font-serif text-xl font-medium mb-2">13 artiklar</h3>
              <p className="text-muted-foreground">
                Väl genomtänkta texter som förklarar vad som händer och hur du kan stötta.
              </p>
            </div>
            <div className="text-center p-6 animate-fade-in stagger-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-medium mb-2">Quiz efter varje artikel</h3>
              <p className="text-muted-foreground">
                Testa din förståelse med AI-genererade frågor. Försök igen hur många gånger du vill.
              </p>
            </div>
            <div className="text-center p-6 animate-fade-in stagger-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-medium mb-2">Stödjande ton</h3>
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
            Första artikeln: {firstArticle.title}
          </h2>
          <div className="bg-card rounded-lg shadow-card overflow-hidden">
            <img 
              src={firstArticle.imageUrl} 
              alt={firstArticle.imageAlt}
              className="w-full h-64 object-cover"
            />
            <div className="p-6 md:p-8">
              <p className="text-muted-foreground mb-6 text-lg">
                {firstArticle.excerpt}
              </p>
              <Button asChild>
                <Link to={`/artikel/${firstArticle.slug}`}>
                  Läs hela artikeln
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container text-center text-muted-foreground">
          <p className="font-serif text-lg mb-2">Relateify</p>
          <p className="text-sm">
            Kunskap som stärker relationer under klimakteriet.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
