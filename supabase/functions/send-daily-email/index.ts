import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Article sequence - single source of truth for email content
// When updating articles, change this data and it will reflect in emails
const ARTICLE_SEQUENCE = [
  { 
    slug: "nar-varlden-skaver", 
    title: "Humörsvängningar - när världen skaver", 
    excerpt: "Hur hormonell omställning påverkar vardagens filter – och hur ni som par navigerar förändringen tillsammans.", 
    image: "article-nar-varlden-skaver.jpg" 
  },
  { 
    slug: "varmevallningar", 
    title: "Värmevallningar – när värmen blir svår att hantera", 
    excerpt: "När kroppen väcker dig mitt i natten – och hur sömnbristen påverkar allt annat.", 
    image: "article-varmevallningar.jpg" 
  },
  { 
    slug: "vardagens-osynliga-tyngd", 
    title: "Extrem trötthet - vardagens osynliga tyngd", 
    excerpt: "Frågan 'vad ska vi äta?' kan vara droppen som får bägaren att rinna över.", 
    image: "article-rummet-tvattstugan.jpg" 
  },
  { 
    slug: "narhet-pa-nya-villkor", 
    title: "Intimitet & närhet – på nya villkor", 
    excerpt: "När lusten förändras och beröringen blir komplicerad – så hittar ni tillbaka till varandra.", 
    image: "article-narhet-pa-nya-villkor.jpg" 
  },
  { 
    slug: "glomska-fokus", 
    title: "Glömska & fokus – När minnet blir en sil", 
    excerpt: "När orden försvinner mitt i meningen och kalendern blir din bästa vän.", 
    image: "article-glomska-fokus.jpg" 
  },
  { 
    slug: "oro-angest", 
    title: "Oro & ångest som inte släpper taget", 
    excerpt: "När ångesten ligger närmare ytan och stressen tar mer plats.", 
    image: "article-oro-angest.jpg" 
  },
  { 
    slug: "motivation-traning", 
    title: "Motivation & träning – när kroppen säger nej", 
    excerpt: "När kroppen inte längre svarar som den brukade och motivationen gömmer sig.", 
    image: "article-motivation-traning.jpg" 
  },
  { 
    slug: "osynlighet-varde", 
    title: "Osynlighet & värde – att känna sig bortglömd", 
    excerpt: "När samhällets blick glider förbi och känslan av att inte längre räknas växer.", 
    image: "article-osynlighet-varde.jpg" 
  },
  { 
    slug: "kropp-spegelbild", 
    title: "Kropp & spegelbild – Den främmande spegelbilden", 
    excerpt: "När kroppen förändras och spegelbilden känns obekant.", 
    image: "article-kropp-spegelbild.jpg" 
  },
  { 
    slug: "kommunikation", 
    title: "Att prata när det är svårt", 
    excerpt: "Konkreta verktyg för att kommunicera när känslorna är starka.", 
    image: "article-att-lyssna.jpg" 
  },
  { 
    slug: "sandwich-generationen", 
    title: "När ni båda har det tungt", 
    excerpt: "Att stötta varandra när livet trycker från flera håll samtidigt.", 
    image: "article-couplepause.jpg" 
  },
  { 
    slug: "klimakteriet-forklarat", 
    title: "Klimakteriet förklarat", 
    excerpt: "En guide till vad som händer i kroppen under klimakteriet.", 
    image: "article-hormon-kartan.jpg" 
  },
  { 
    slug: "hormonbehandling", 
    title: "Hormonbehandling: En guide för partners", 
    excerpt: "Vad du behöver veta om HRT – från myter till praktik.", 
    image: "article-hormonbehandling.jpg" 
  },
];

const TOTAL_ARTICLES = ARTICLE_SEQUENCE.length;

// Image base URL - images need to be in public/images folder
const IMAGE_BASE_URL = "https://partnerguiden-klimakteriet.lovable.app/images";

const BASE_URL = "https://partnerguiden-klimakteriet.lovable.app";

// Helper to generate email content based on progress
function getProgressMessage(articleIndex: number, isLastArticle: boolean, displayName: string): string {
  if (articleIndex === 0) {
    return "Välkommen till din första artikel! 🎉";
  }
  if (isLastArticle) {
    return `🎊 Grattis ${displayName}! Du har nått sista artikeln i serien – dag ${articleIndex + 1} av ${TOTAL_ARTICLES}. Det här är en fantastisk prestation!`;
  }
  return `Fantastiskt att du fortsätter! Du är nu på dag ${articleIndex + 1} av ${TOTAL_ARTICLES}. 💪`;
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

    // Get users who should receive emails
    // For admin test: only get admin users
    // For production: get users based on their frequency preference and journey_start_date
    let usersQuery = supabase
      .from("user_preferences")
      .select("user_id, email_frequency, skip_weekends, journey_start_date, email_enabled")
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

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let emailsSent = 0;
    let emailsSkipped = 0;

    for (const pref of preferences) {
      try {
        // Skip weekends if user preference says so (unless admin test)
        if (!isAdminTest && pref.skip_weekends && isWeekend) {
          console.log(`Skipping user ${pref.user_id} - weekend`);
          emailsSkipped++;
          continue;
        }

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
        // We need to ensure it includes the redirect_to parameter
        let magicLink = magicLinkData.properties?.action_link;
        
        if (magicLink) {
          console.log(`Generated magic link: ${magicLink}`);
          // Verify the redirect is included, if not append it
          if (!magicLink.includes('redirect_to=')) {
            const separator = magicLink.includes('?') ? '&' : '?';
            magicLink = `${magicLink}${separator}redirect_to=${encodeURIComponent(redirectUrl)}`;
          }
        } else {
          // Fallback to direct link (user won't be auto-logged in)
          magicLink = redirectUrl;
          console.log(`No magic link generated, using direct link: ${magicLink}`);
        }
        
        console.log(`Final link in email: ${magicLink}`);

        // Generate dynamic content based on progress
        const progressMessage = getProgressMessage(nextArticleIndex, isLastArticle, displayName);
        const footerMessage = getFooterMessage(nextArticleIndex, isLastArticle);
        const subjectPrefix = isLastArticle ? "🎊" : "📖";
        const subjectSuffix = isLastArticle ? " (Sista artikeln!)" : "";

        // Send email with Duolingo-style encouraging tone
        const emailResult = await resend.emails.send({
          from: "Partnerguiden: Klimakteriet <onboarding@resend.dev>",
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
                    <img src="${IMAGE_BASE_URL}/${article.image}" alt="${article.title}" style="width: 100%; height: auto; display: block;" />
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
