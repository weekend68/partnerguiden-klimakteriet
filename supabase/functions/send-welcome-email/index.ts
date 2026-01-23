import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://partnerguiden.se";

// HMAC-SHA256 for unsubscribe link
async function generateHMAC(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const unsubscribeSecret = Deno.env.get("UNSUBSCRIBE_SECRET")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // This function can be called by a database webhook or manually
    const { user_id, email, display_name } = await req.json();

    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const name = display_name || "du";

    // Generate unsubscribe link with HMAC signature
    const expiry = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year
    const message = `${user_id}:${expiry}`;
    const token = await generateHMAC(message, unsubscribeSecret);
    const unsubscribeUrl = `${supabaseUrl}/functions/v1/unsubscribe?token=${encodeURIComponent(token)}&id=${user_id}&exp=${expiry}`;

    console.log(`Sending welcome email to ${email} (user: ${user_id})`);

    const emailResult = await resend.emails.send({
      from: "Partnerguiden: Klimakteriet <noreply@partnerguiden.se>",
      to: [email],
      subject: "🎉 Välkommen till Partnerguiden!",
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
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🎉 Välkommen!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #6B5B4F; font-size: 18px;">Hej ${name}! 👋</p>
              
              <p style="margin: 0 0 20px 0; color: #4A4A4A; font-size: 16px; line-height: 1.6;">
                Tack för att du registrerade dig på <strong>Partnerguiden: Klimakteriet</strong>. 
                Du har tagit ett viktigt steg för att bli en bättre partner.
              </p>
              
              <p style="margin: 0 0 25px 0; color: #4A4A4A; font-size: 16px; line-height: 1.6;">
                <strong>Så här fungerar det:</strong>
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f4f0; border-radius: 8px; margin-bottom: 10px;">
                    <p style="margin: 0; color: #4A4A4A; font-size: 15px;">
                      📬 <strong>Dagligt mail</strong> – Du får ett mail varje dag kl 18:00 med nästa artikel
                    </p>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background-color: #f8f4f0; border-radius: 8px; margin-bottom: 10px;">
                    <p style="margin: 0; color: #4A4A4A; font-size: 15px;">
                      📊 <strong>Följ framstegen</strong> – Se hur långt du kommit i kursen
                    </p>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background-color: #f8f4f0; border-radius: 8px;">
                    <p style="margin: 0; color: #4A4A4A; font-size: 15px;">
                      🎓 <strong>Diplom</strong> – När du klarat alla quiz får du ett diplom
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 25px 0; color: #4A4A4A; font-size: 16px; line-height: 1.6;">
                Ditt första mail kommer imorgon klockan 18:00. Fram tills dess kan du börja läsa direkt på sajten!
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${BASE_URL}/artiklar" style="display: inline-block; background: linear-gradient(135deg, #8B7355 0%, #6B5B4F 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(139, 115, 85, 0.3);">
                      Börja läsa första artikeln →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; color: #888; font-size: 14px; text-align: center; line-height: 1.5;">
                Tack för att du vill lära dig mer. Tillsammans gör ni det bättre. 💛
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f4f0; padding: 25px 30px; text-align: center; border-top: 1px solid #e8e0d8;">
              <p style="margin: 0; color: #888; font-size: 12px;">
                © ${new Date().getFullYear()} Partnerguiden: Klimakteriet
              </p>
              <p style="margin: 10px 0 0 0; color: #aaa; font-size: 11px;">
                Du får detta mail för att du precis skapade ett konto på partnerguiden.se
              </p>
              <p style="margin: 10px 0 0 0;">
                <a href="${unsubscribeUrl}" style="color: #aaa; font-size: 11px; text-decoration: underline;">
                  Avregistrera dig från dagliga mail
                </a>
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

    console.log("Welcome email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, result: emailResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
