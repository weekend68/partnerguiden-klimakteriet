import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleAdmin } from "@/components/admin/ArticleAdmin";
import { Users, BookOpen, CheckCircle, TrendingUp, ArrowLeft, Loader2, ShieldAlert, Mail, Play, RefreshCw, FileText, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface ArticleTitleMap {
  [slug: string]: string;
}
interface AdminStats {
  totalUsers: number;
  usersWithProgress: number;
  completedUsers: number;
  completionRate: number;
  avgArticlesRead: number;
  avgQuizzesCompleted: number;
  mostReadArticles: { slug: string; count: number }[];
  quizStats: { slug: string; completions: number; averageScore: number }[];
  dailySignups?: { date: string; count: number }[];
  dailyActiveUsers?: { date: string; count: number }[];
  topActiveUsers?: { userId: string; quizzesCompleted: number }[];
}

interface EmailPreferences {
  email_enabled: boolean;
  email_frequency: string;
  journey_start_date: string;
}

interface EmailLogEntry {
  article_slug: string;
  article_index: number;
  sent_at: string;
  status: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences | null>(null);
  const [emailLog, setEmailLog] = useState<EmailLogEntry[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [articleTitles, setArticleTitles] = useState<ArticleTitleMap>({});

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

    const fetchEmailData = async () => {
      if (!user) return;
      
      // Fetch email preferences
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (prefs) {
        setEmailPrefs(prefs as EmailPreferences);
      }

      // Fetch email log
      const { data: logs } = await supabase
        .from("email_log")
        .select("*")
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false });
      
      if (logs) {
        setEmailLog(logs as EmailLogEntry[]);
      }
    };

    const fetchArticleTitles = async () => {
      const { data } = await supabase
        .from("articles")
        .select("slug, title");
      
      if (data) {
        const titleMap: ArticleTitleMap = {};
        data.forEach((article) => {
          titleMap[article.slug] = article.title;
        });
        setArticleTitles(titleMap);
      }
    };

    fetchStats();
    fetchEmailData();
    fetchArticleTitles();
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const enableEmailFlow = async () => {
    if (!user) return;
    setEmailLoading(true);
    
    try {
      const { error } = await supabase.from("user_preferences").insert({
        user_id: user.id,
        email_frequency: "daily",
        skip_weekends: false,
        email_enabled: true,
      });

      if (error) throw error;

      toast.success("Mejlflöde aktiverat! Du får första mejlet inom 2 minuter.");
      
      // Refresh data
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (prefs) {
        setEmailPrefs(prefs as EmailPreferences);
      }
    } catch (err) {
      console.error("Error enabling email flow:", err);
      toast.error("Kunde inte aktivera mejlflöde");
    } finally {
      setEmailLoading(false);
    }
  };

  const triggerTestEmail = async () => {
    setTriggerLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-daily-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "x-admin-test": "true",
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Mejl skickat! (${data.emailsSent} mejl)`);
        
        // Refresh email log
        if (user) {
          const { data: logs } = await supabase
            .from("email_log")
            .select("*")
            .eq("user_id", user.id)
            .order("sent_at", { ascending: false });
          
          if (logs) {
            setEmailLog(logs as EmailLogEntry[]);
          }
        }
      } else {
        throw new Error(data.error || "Kunde inte skicka mejl");
      }
    } catch (err) {
      console.error("Error triggering email:", err);
      toast.error(err instanceof Error ? err.message : "Kunde inte skicka mejl");
    } finally {
      setTriggerLoading(false);
    }
  };

  const resetEmailLog = async () => {
    if (!user) return;
    
    try {
      // We can't delete with RLS, but we can use service role in edge function
      // For now, just show info
      toast.info("Kontakta support för att återställa mejlloggen");
    } catch (err) {
      console.error("Error resetting log:", err);
    }
  };

  const getArticleTitle = (slug: string) => {
    return articleTitles[slug] || slug;
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

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList>
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistik
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-2">
              <FileText className="h-4 w-4" />
              Artiklar
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Mejlflöde
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
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
                            Snitt: {quiz.averageScore}/5
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

            {/* Activity Charts */}
            <div className="grid gap-4 md:grid-cols-2 mt-8">
              {/* Daily Signups */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nya användare (senaste 30 dagarna)</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.dailySignups && stats.dailySignups.length > 0 ? (
                    <div className="space-y-2">
                      {stats.dailySignups.slice(-10).map((day) => (
                        <div key={day.date} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {new Date(day.date).toLocaleDateString("sv-SE", { month: "short", day: "numeric" })}
                          </span>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 bg-primary rounded"
                              style={{ width: `${Math.min(day.count * 20, 100)}px` }}
                            />
                            <span className="font-medium text-foreground w-8 text-right">
                              {day.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ingen data ännu</p>
                  )}
                </CardContent>
              </Card>

              {/* Daily Active Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Aktiva användare per dag</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.dailyActiveUsers && stats.dailyActiveUsers.length > 0 ? (
                    <div className="space-y-2">
                      {stats.dailyActiveUsers.slice(-10).map((day) => (
                        <div key={day.date} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">
                            {new Date(day.date).toLocaleDateString("sv-SE", { month: "short", day: "numeric" })}
                          </span>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 bg-accent rounded"
                              style={{ width: `${Math.min(day.count * 20, 100)}px` }}
                            />
                            <span className="font-medium text-foreground w-8 text-right">
                              {day.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ingen data ännu</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Active Users */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Mest aktiva användare (quiz)</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topActiveUsers && stats.topActiveUsers.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {stats.topActiveUsers.map((user, index) => (
                      <div key={user.userId} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <span className="text-lg font-bold text-primary">#{index + 1}</span>
                        <div className="text-sm">
                          <span className="text-muted-foreground font-mono">{user.userId}</span>
                          <div className="font-medium">{user.quizzesCompleted}/13 quiz</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen data ännu</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
          </TabsContent>

          <TabsContent value="articles">
            <ArticleAdmin />
          </TabsContent>

          <TabsContent value="email">
        {/* Email Flow Testing Section */}
        <div>
          <h2 className="font-serif text-2xl font-medium mb-6 flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Mejlflöde (Admin Test)
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Email Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Din mejlstatus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {emailPrefs ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`font-medium ${emailPrefs.email_enabled ? "text-green-600" : "text-red-600"}`}>
                        {emailPrefs.email_enabled ? "Aktivt" : "Pausat"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Frekvens</span>
                      <span className="font-medium text-foreground">
                        {emailPrefs.email_frequency === "daily" ? "Dagligen" : "Veckovis"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Mejl skickade</span>
                      <span className="font-medium text-foreground">{emailLog.length} / 13</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">Mejlflöde ej aktiverat</p>
                    <Button onClick={enableEmailFlow} disabled={emailLoading}>
                      {emailLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Aktivera mejlflöde
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manual Trigger Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manuell triggning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Cron-jobbet körs automatiskt var 2:a minut för admin-användare. 
                  Du kan också trigga det manuellt här.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={triggerTestEmail} 
                    disabled={triggerLoading || !emailPrefs}
                    className="flex-1"
                  >
                    {triggerLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Skicka test-mejl nu
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetEmailLog}
                    disabled={!emailPrefs}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Log */}
          {emailLog.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Skickade mejl</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {emailLog.map((log, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">
                        Dag {log.article_index + 1}: {getArticleTitle(log.article_slug)}
                      </span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`${log.status === "sent" ? "text-green-600" : "text-red-600"}`}>
                          {log.status === "sent" ? "✓ Skickat" : "✗ Misslyckades"}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(log.sent_at).toLocaleString("sv-SE")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
