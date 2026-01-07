import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Image base URL - images need to be in public/images folder
const IMAGE_BASE_URL = "https://partnerguiden.moller-co.se/images";

const BASE_URL = "https://partnerguiden.moller-co.se";

interface ArticleData {
  slug: string;
  title: string;
  excerpt: string;
  image_filename: string;
  sort_order: number;
}

// Helper to generate email content based on progress
function getProgressMessage(articleIndex: number, isLastArticle: boolean, totalArticles: number, displayName: string): string {
  if (articleIndex === 0) {
    return "Välkommen till din första artikel! 🎉";
  }
  if (isLastArticle) {
    return `🎊 Grattis ${displayName}! Du har nått sista artikeln i serien – dag ${articleIndex + 1} av ${totalArticles}. Det här är en fantastisk prestation!`;
  }
  return `Fantastiskt att du fortsätter! Du är nu på dag ${articleIndex + 1} av ${totalArticles}. 💪`;
}

function getFooterMessage(articleIndex: number, isLastArticle: boolean): string {
  if (isLastArticle) {
    return "🌟 Detta är det sista mejlet i serien. Tack för att du följt med hela vägen! Du kan alltid gå tillbaka och läsa artiklarna igen på Partnerguiden.";
  }
  if (articleIndex < 6) {
    return "Varje artikel ger er nya verktyg att navigera tillsammans.";
  }
  return "Du har redan lärt dig så mycket! Fortsätt den goda trenden. 🌟";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is an admin test (2-minute interval)
    const isAdminTest = req.headers.get("x-admin-test") === "true";
    
    console.log(`Running email job. Admin test: ${isAdminTest}`);

    // Fetch articles from database (sorted by sort_order)
    const { data: articlesData, error: articlesError } = await supabase
      .from("articles")
      .select("slug, title, excerpt, image_filename, sort_order")
      .order("sort_order", { ascending: true });

    if (articlesError) {
      console.error("Error fetching articles:", articlesError);
      throw articlesError;
    }

    if (!articlesData || articlesData.length === 0) {
      console.log("No articles found in database");
      return new Response(JSON.stringify({ message: "No articles in database" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ARTICLE_SEQUENCE: ArticleData[] = articlesData;
    const TOTAL_ARTICLES = ARTICLE_SEQUENCE.length;

    console.log(`Loaded ${TOTAL_ARTICLES} articles from database`);

    // Get users who should receive emails
    let usersQuery = supabase
      .from("user_preferences")
      .select("user_id, email_frequency, journey_start_date, email_enabled")
      .eq("email_enabled", true);

    const { data: preferences, error: prefError } = await usersQuery;

    if (prefError) {
      console.error("Error fetching preferences:", prefError);
      throw prefError;
    }

    if (!preferences || preferences.length === 0) {
      console.log("No users with email preferences found");
      return new Response(JSON.stringify({ message: "No users to email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emailsSent = 0;
    let emailsSkipped = 0;

    for (const pref of preferences) {
      try {

        // Check if user is admin (for admin test mode)
        if (isAdminTest) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", pref.user_id)
            .eq("role", "admin")
            .single();

          if (!roles) {
            console.log(`Skipping user ${pref.user_id} - not admin (admin test mode)`);
            continue;
          }
        }

        // Get user's email from auth
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(pref.user_id);
        
        if (userError || !userData.user?.email) {
          console.error(`Could not get email for user ${pref.user_id}:`, userError);
          continue;
        }

        const userEmail = userData.user.email;
        const displayName = userData.user.user_metadata?.display_name || "du";

        // Get sent emails count for this user
        const { data: sentEmails, error: sentError } = await supabase
          .from("email_log")
          .select("article_index")
          .eq("user_id", pref.user_id)
          .eq("status", "sent")
          .order("article_index", { ascending: false })
          .limit(1);

        if (sentError) {
          console.error(`Error fetching sent emails for ${pref.user_id}:`, sentError);
          continue;
        }

        // Determine next article index
        const lastSentIndex = sentEmails && sentEmails.length > 0 ? sentEmails[0].article_index : -1;
        const nextArticleIndex = lastSentIndex + 1;

        // Check if all articles have been sent
        if (nextArticleIndex >= TOTAL_ARTICLES) {
          console.log(`User ${pref.user_id} has received all articles`);
          continue;
        }

        const article = ARTICLE_SEQUENCE[nextArticleIndex];
        const isLastArticle = nextArticleIndex === TOTAL_ARTICLES - 1;
        
        // Generate magic link for auto-login
        const redirectUrl = `${BASE_URL}/artikel/${article.slug}`;
        console.log(`Generating magic link with redirect to: ${redirectUrl}`);
        
        const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: userEmail,
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (magicLinkError) {
          console.error(`Error generating magic link for ${pref.user_id}:`, magicLinkError);
          continue;
        }

        // The action_link from Supabase contains the magic link with token
        let magicLink = magicLinkData.properties?.action_link;
        
        if (magicLink) {
          console.log(`Generated magic link: ${magicLink}`);
          if (!magicLink.includes('redirect_to=')) {
            const separator = magicLink.includes('?') ? '&' : '?';
            magicLink = `${magicLink}${separator}redirect_to=${encodeURIComponent(redirectUrl)}`;
          }
        } else {
          magicLink = redirectUrl;
          console.log(`No magic link generated, using direct link: ${magicLink}`);
        }
        
        console.log(`Final link in email: ${magicLink}`);

        // Generate dynamic content based on progress
        const progressMessage = getProgressMessage(nextArticleIndex, isLastArticle, TOTAL_ARTICLES, displayName);
        const footerMessage = getFooterMessage(nextArticleIndex, isLastArticle);
        const subjectPrefix = isLastArticle ? "🎊" : "📖";
        const subjectSuffix = isLastArticle ? " (Sista artikeln!)" : "";

        // Send email with Duolingo-style encouraging tone
        const emailResult = await resend.emails.send({
          from: "Partnerguiden: Klimakteriet <noreply@partnerguiden.moller-co.se>",
          to: [userEmail],
          subject: `${subjectPrefix} Dag ${nextArticleIndex + 1}: ${article.title}${subjectSuffix}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f4f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f4f0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8B7355 0%, #A0876B 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Partnerguiden: Klimakteriet</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Din resa genom klimakteriet – tillsammans</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #6B5B4F; font-size: 16px;">Hej ${displayName}! 👋</p>
              
              <p style="margin: 0 0 25px 0; color: #4A4A4A; font-size: 16px; line-height: 1.6;">
                ${progressMessage}
              </p>
              
              <!-- Article Card with Image -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f4f0; border-radius: 12px; overflow: hidden; margin-bottom: 25px;">
                <tr>
                  <td>
                    <img src="${IMAGE_BASE_URL}/${article.image_filename}" alt="${article.title}" style="width: 100%; height: auto; display: block;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0 0 5px 0; color: #8B7355; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">${isLastArticle ? "Sista artikeln" : `Dag ${nextArticleIndex + 1}`}</p>
                    <h2 style="margin: 0 0 15px 0; color: #2D2D2D; font-size: 22px; font-weight: 600;">${article.title}</h2>
                    <p style="margin: 0; color: #6B5B4F; font-size: 15px; line-height: 1.5;">${article.excerpt}</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #8B7355 0%, #6B5B4F 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(139, 115, 85, 0.3);">
                      ${isLastArticle ? "Läs sista artikeln →" : "Läs dagens artikel →"}
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; color: #888; font-size: 14px; text-align: center; line-height: 1.5;">
                ${footerMessage}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f4f0; padding: 25px 30px; text-align: center; border-top: 1px solid #e8e0d8;">
              <p style="margin: 0 0 10px 0; color: #888; font-size: 12px;">
                Du får detta mejl för att du har registrerat dig på Partnerguiden.
              </p>
              <p style="margin: 0; color: #888; font-size: 12px;">
                <a href="${BASE_URL}/avregistrera?token=${btoa(pref.user_id)}" style="color: #8B7355; text-decoration: underline;">Avsluta prenumeration</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
        });

        console.log(`Email sent to ${userEmail}:`, emailResult);

        // Log the sent email
        const { error: logError } = await supabase.from("email_log").insert({
          user_id: pref.user_id,
          article_slug: article.slug,
          article_index: nextArticleIndex,
          status: "sent",
        });

        if (logError) {
          console.error(`Error logging email for ${pref.user_id}:`, logError);
        }

        emailsSent++;
      } catch (userError) {
        console.error(`Error processing user ${pref.user_id}:`, userError);
      }
    }

    console.log(`Email job completed. Sent: ${emailsSent}, Skipped: ${emailsSkipped}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent, 
        emailsSkipped,
        totalUsers: preferences.length 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-daily-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
