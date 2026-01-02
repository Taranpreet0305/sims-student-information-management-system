import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, data } = await req.json();

    let systemPrompt = '';
    let userMessage = '';

    switch (action) {
      case 'generate_feedback_summary':
        systemPrompt = `You are an educational analytics assistant. Analyze the following student feedback and provide a concise summary highlighting:
1. Key positive points
2. Areas needing improvement
3. Common themes
4. Actionable recommendations for faculty

Be professional and constructive. Keep the summary under 200 words.`;
        userMessage = `Here is the feedback data to analyze:\n${JSON.stringify(data.feedback, null, 2)}`;
        break;

      case 'analyze_performance':
        systemPrompt = `You are an academic performance analyst. Based on the student's performance data, provide:
1. Performance assessment (strengths and weaknesses)
2. Subject-wise analysis
3. Improvement suggestions
4. Study recommendations

Be encouraging and specific. Keep the analysis under 250 words.`;
        userMessage = `Student Performance Data:\n${JSON.stringify(data.performance, null, 2)}`;
        break;

      case 'generate_notice':
        systemPrompt = `You are a professional academic notice writer. Generate a formal notice based on the given topic. Include:
- Clear subject line
- Well-structured content
- Professional tone
- Relevant details

Keep it concise and formal.`;
        userMessage = `Generate a notice about: ${data.topic}`;
        break;

      case 'election_analysis':
        systemPrompt = `You are an election data analyst. Analyze the election results and provide:
1. Overall participation summary
2. Key statistics
3. Winner analysis
4. Voter engagement insights

Be factual and objective. Keep it under 150 words.`;
        userMessage = `Election Results:\n${JSON.stringify(data.results, null, 2)}`;
        break;

      case 'attendance_insights':
        systemPrompt = `You are an attendance analytics assistant. Analyze the attendance data and provide:
1. Overall attendance trends
2. Students at risk (below 75%)
3. Improvement suggestions
4. Pattern analysis

Be helpful and actionable. Keep it under 200 words.`;
        userMessage = `Attendance Data:\n${JSON.stringify(data.attendance, null, 2)}`;
        break;

      default:
        systemPrompt = `You are a helpful educational assistant for a college management system. Provide clear and professional responses.`;
        userMessage = data.message || 'Hello';
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content || 'No response generated';

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
