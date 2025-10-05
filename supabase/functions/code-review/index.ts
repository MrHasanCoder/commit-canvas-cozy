import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code, language = 'javascript', userLevel = 'intermediate' } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ success: false, error: "Code is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert code reviewer and security specialist with extensive experience in ${language}. 
Analyze the code for a ${userLevel} level programmer and provide:

## Security Vulnerabilities
List any security vulnerabilities, potential exploits, or critical security issues. Be specific about the risks.

## Code Quality Issues
Identify code smells, performance issues, bad practices, or areas for improvement.

## Best Practice Recommendations
Provide specific, actionable recommendations following industry best practices and ${language} conventions.

## Corrected & Optimized Code
**IMPORTANT**: Provide a complete, secure, and optimized version of the code that:
- Fixes all security vulnerabilities
- Implements all recommended improvements
- Follows best coding practices
- Includes inline comments explaining key changes
- Is production-ready and secure

Format the corrected code in a markdown code block with proper syntax highlighting.

Be thorough but concise. Format your entire response in markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ success: false, error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const review = data.choices[0].message.content;

    return new Response(JSON.stringify({ success: true, review }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in code-review function:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
