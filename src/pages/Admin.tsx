import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { articles } from "@/data/articles";
import { Users, BookOpen, CheckCircle, TrendingUp, ArrowLeft, Loader2, ShieldAlert } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  usersWithProgress: number;
  completedUsers: number;
  completionRate: number;
  avgArticlesRead: number;
  avgQuizzesCompleted: number;
  mostReadArticles: { slug: string; count: number }[];
  quizStats: { slug: string; completions: number; averageScore: number }[];
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || adminLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("Ingen aktiv session");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stats`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Kunde inte hämta statistik");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError(err instanceof Error ? err.message : "Något gick fel");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const getArticleTitle = (slug: string) => {
    const article = articles.find((a) => a.slug === slug);
    return article?.title || slug;
  };

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-heading text-foreground mb-2">Åtkomst nekad</h1>
            <p className="text-muted-foreground mb-6">
              Du har inte behörighet att se denna sida.
            </p>
            <Button onClick={() => navigate("/")}>Tillbaka till startsidan</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-heading text-foreground mb-2">Fel</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Försök igen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-serif text-lg sm:text-xl font-semibold text-foreground leading-tight">
            <span className="sm:hidden">Partnerguiden:<br />Klimakteriet</span>
            <span className="hidden sm:inline">Partnerguiden: Klimakteriet</span>
          </Link>
          <span className="text-sm text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
            Admin
          </span>
        </div>
      </header>

      <main className="container py-8">
        <Link 
          to="/" 
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka till startsidan
        </Link>

        <h1 className="font-serif text-3xl font-medium mb-8">Admin Dashboard</h1>

        {stats && (
          <>
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Registrerade användare
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading text-foreground">{stats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Användare med progress
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading text-foreground">{stats.usersWithProgress}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Slutfört kursen
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading text-foreground">{stats.completedUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completion rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-heading text-foreground">{stats.completionRate}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Average Progress */}
            <div className="grid gap-4 md:grid-cols-2 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Genomsnittlig progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Artiklar lästa (snitt)</span>
                      <span className="text-xl font-heading text-foreground">
                        {stats.avgArticlesRead} / 13
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Quiz klarade (snitt)</span>
                      <span className="text-xl font-heading text-foreground">
                        {stats.avgQuizzesCompleted} / 13
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mest lästa artiklar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.mostReadArticles.length > 0 ? (
                      stats.mostReadArticles.map((article, index) => (
                        <div key={article.slug} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground truncate max-w-[70%]">
                            {index + 1}. {getArticleTitle(article.slug)}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {article.count} läsningar
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Ingen data ännu</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quiz Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quiz-resultat per artikel</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.quizStats.length > 0 ? (
                  <div className="space-y-3">
                    {stats.quizStats.map((quiz) => (
                      <div key={quiz.slug} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <span className="text-sm text-muted-foreground truncate max-w-[50%]">
                          {getArticleTitle(quiz.slug)}
                        </span>
                        <div className="flex gap-6 text-sm">
                          <span className="text-muted-foreground">
                            {quiz.completions} genomförda
                          </span>
                          <span className="font-medium text-foreground">
                            Snitt: {quiz.averageScore}/3
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen quiz-data ännu</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
