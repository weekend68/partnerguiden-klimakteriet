import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HMAC-SHA256 signing for secure tokens
async function generateHMAC(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifyHMAC(message: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await generateHMAC(message, secret);
  return signature === expectedSignature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const userId = url.searchParams.get("id");
    const expiry = url.searchParams.get("exp");

    console.log(`Unsubscribe request: userId=${userId}, expiry=${expiry}`);

    // Validate required parameters
    if (!token || !userId || !expiry) {
      console.log("Missing required parameters");
      return new Response(
        generateHTML("error", "Ogiltig avregistreringslänk. Parametrar saknas."),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Check expiry
    const expiryTimestamp = parseInt(expiry, 10);
    if (isNaN(expiryTimestamp) || Date.now() > expiryTimestamp) {
      console.log(`Token expired: ${new Date(expiryTimestamp).toISOString()}`);
      return new Response(
        generateHTML("error", "Länken har gått ut. Kontakta oss för hjälp med avregistrering."),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Get the secret for HMAC verification
    const unsubscribeSecret = Deno.env.get("UNSUBSCRIBE_SECRET");
    if (!unsubscribeSecret) {
      console.error("UNSUBSCRIBE_SECRET not configured");
      return new Response(
        generateHTML("error", "Serverfel. Försök igen senare."),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Verify HMAC signature
    const message = `${userId}:${expiry}`;
    const isValid = await verifyHMAC(message, token, unsubscribeSecret);

    if (!isValid) {
      console.log("Invalid HMAC signature");
      return new Response(
        generateHTML("error", "Ogiltig avregistreringslänk. Signaturen kunde inte verifieras."),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update user preferences
    const { data, error } = await supabase
      .from("user_preferences")
      .update({ email_enabled: false })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating preferences:", error);
      return new Response(
        generateHTML("error", "Kunde inte avregistrera. Försök igen eller kontakta oss."),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    console.log(`Successfully unsubscribed user ${userId}`);

    return new Response(
      generateHTML("success", "Du är nu avregistrerad från mejlutskick."),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
    );

  } catch (error: any) {
    console.error("Unsubscribe error:", error);
    return new Response(
      generateHTML("error", "Ett oväntat fel uppstod. Försök igen senare."),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
    );
  }
});

function generateHTML(status: "success" | "error", message: string): string {
  const isSuccess = status === "success";
  const icon = isSuccess 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  
  const title = isSuccess ? "Avregistrerad" : "Något gick fel";

  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Partnerguiden</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f8f4f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .icon { margin-bottom: 24px; }
    h1 {
      color: #2D2D2D;
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      color: #6B5B4F;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #8B7355 0%, #6B5B4F 100%);
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 30px;
      font-size: 16px;
      font-weight: 600;
    }
    .button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://partnerguiden.se" class="button">Till startsidan</a>
  </div>
</body>
</html>`;
}
