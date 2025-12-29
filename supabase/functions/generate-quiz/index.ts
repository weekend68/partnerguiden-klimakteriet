import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { articleTitle, articleContent } = body;

    // Input validation
    if (!articleTitle || typeof articleTitle !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid article title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!articleContent || typeof articleContent !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid article content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce reasonable length limits to prevent resource exhaustion
    if (articleTitle.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Article title too long (max 200 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (articleContent.length > 50000) {
      return new Response(
        JSON.stringify({ error: 'Article content too long (max 50000 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating quiz for article:", articleTitle);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Du är en expert på att skapa reflekterande quizfrågor för par som vill förstå klimakteriet bättre. 
            
Skapa 5 reflekterande frågor baserat på artikeln. Varje fråga ska:
- Hjälpa partnern förstå hur hen kan stötta bättre
- Vara empatisk och respektfull
- Ha 4 svarsalternativ där ett är "bäst" (mest empatiskt/stöttande)
- Fokusera på praktiska situationer från artikeln

VIKTIGT FÖR SVARSALTERNATIV:
- Alla 4 svarsalternativ ska ha UNGEFÄR SAMMA LÄNGD (15-40 ord var)
- Det korrekta svaret får INTE alltid vara längst eller mest detaljerat
- Variera vilken position (0-3) det korrekta svaret har mellan frågorna
- Gör alla alternativ realistiska och trovärdiga

Svara ENDAST med giltig JSON i exakt detta format:
{
  "questions": [
    {
      "question": "Frågan här",
      "options": ["Alternativ A", "Alternativ B", "Alternativ C", "Alternativ D"],
      "correctIndex": 0,
      "explanation": "Kort förklaring varför detta svar är bäst"
    }
  ]
}`
          },
          {
            role: "user",
            content: `Artikel: "${articleTitle}"\n\nInnehåll:\n${articleContent.substring(0, 3000)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "För många förfrågningar, vänta en stund." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Krediter slut, kontakta support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("Raw AI response:", content);

    // Parse the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse quiz from AI response");
    }

    const quiz = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(quiz), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
