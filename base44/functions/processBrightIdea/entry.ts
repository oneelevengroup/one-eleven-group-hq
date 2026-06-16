import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { idea } = await req.json();
    if (!idea || !idea.trim()) {
      return Response.json({ error: 'No idea provided' }, { status: 400 });
    }

    const parsed = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this idea and determine the best category and whether to refine it slightly for clarity.

Categories: Marketing, Operations, Growth, Creative, Tech, Other

Idea: "${idea}"

Return the refined version (keep the user's voice and intent, just clarify if needed) and the best-fitting category.`,
      response_json_schema: {
        type: 'object',
        properties: {
          refined_content: { type: 'string' },
          category: { type: 'string' },
        },
        required: ['refined_content', 'category'],
      },
    });

    const brightIdea = await base44.entities.BrightIdea.create({
      content: parsed.refined_content || idea,
      category: parsed.category || 'Other',
      status: 'Fresh',
      notes: '',
    });

    return Response.json({ success: true, idea: brightIdea });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});