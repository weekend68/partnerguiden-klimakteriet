import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error("User authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    // Use service role client to check admin status and fetch stats
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("Error checking admin role:", roleError);
      return new Response(
        JSON.stringify({ error: "Error checking permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!roleData) {
      console.error("User is not admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin verified, fetching stats...");

    // Fetch all stats using service role (bypasses RLS)
    
    // 1. Total registered users
    const { count: totalUsers, error: usersError } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (usersError) {
      console.error("Error fetching users:", usersError);
    }

    // 2. All progress data
    const { data: progressData, error: progressError } = await adminClient
      .from("user_progress")
      .select("user_id, article_slug, article_read, quiz_completed, quiz_score");

    if (progressError) {
      console.error("Error fetching progress:", progressError);
    }

    // Calculate stats
    const progress = progressData || [];
    
    // Unique users with any progress
    const usersWithProgress = new Set(progress.map(p => p.user_id)).size;
    
    // Users who completed all 13 articles and quizzes
    const userProgressMap = new Map<string, { articles: number; quizzes: number }>();
    progress.forEach(p => {
      const current = userProgressMap.get(p.user_id) || { articles: 0, quizzes: 0 };
      if (p.article_read) current.articles++;
      if (p.quiz_completed) current.quizzes++;
      userProgressMap.set(p.user_id, current);
    });

    const completedUsers = Array.from(userProgressMap.values())
      .filter(p => p.articles === 13 && p.quizzes === 13).length;

    // Completion rate
    const completionRate = usersWithProgress > 0 
      ? Math.round((completedUsers / usersWithProgress) * 100) 
      : 0;

    // Most read articles
    const articleReadCounts = new Map<string, number>();
    progress.forEach(p => {
      if (p.article_read) {
        articleReadCounts.set(p.article_slug, (articleReadCounts.get(p.article_slug) || 0) + 1);
      }
    });
    const mostReadArticles = Array.from(articleReadCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug, count]) => ({ slug, count }));

    // Quiz results per article
    const quizResults = new Map<string, { total: number; scores: number[] }>();
    progress.forEach(p => {
      if (p.quiz_completed && p.quiz_score !== null) {
        const current = quizResults.get(p.article_slug) || { total: 0, scores: [] };
        current.total++;
        current.scores.push(p.quiz_score);
        quizResults.set(p.article_slug, current);
      }
    });
    const quizStats = Array.from(quizResults.entries())
      .map(([slug, data]) => ({
        slug,
        completions: data.total,
        averageScore: Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10,
      }))
      .sort((a, b) => b.completions - a.completions);

    // Average progress
    const avgArticlesRead = usersWithProgress > 0
      ? Math.round(Array.from(userProgressMap.values()).reduce((sum, p) => sum + p.articles, 0) / usersWithProgress * 10) / 10
      : 0;
    const avgQuizzesCompleted = usersWithProgress > 0
      ? Math.round(Array.from(userProgressMap.values()).reduce((sum, p) => sum + p.quizzes, 0) / usersWithProgress * 10) / 10
      : 0;

    const stats = {
      totalUsers: totalUsers || 0,
      usersWithProgress,
      completedUsers,
      completionRate,
      avgArticlesRead,
      avgQuizzesCompleted,
      mostReadArticles,
      quizStats,
    };

    console.log("Stats calculated successfully");

    return new Response(
      JSON.stringify(stats),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
