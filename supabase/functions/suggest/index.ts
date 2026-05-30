import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_PILLARS = ['train', 'live', 'think', 'feel', 'fuel'] as const
const VALID_PLATFORMS = ['tiktok', 'instagram', 'linkedin'] as const

const PILLAR_LABELS: Record<string, string> = {
  train: 'Train (fitness, CrossFit, performance)',
  live: 'Live (lifestyle, day-in-the-life)',
  think: 'Think (AI, learning, ideas)',
  feel: 'Feel (mindset, recovery, emotion)',
  fuel: 'Fuel (nutrition, recovery fuel)',
}

const PLATFORM_NORMS: Record<string, string> = {
  tiktok:
    'short, punchy, conversational hooks; trend-aware; casual but confident tone',
  instagram:
    'engaging opener, line breaks for readability, mix of story and value; hashtag-friendly',
  linkedin:
    'professional but authentic; thought leadership angle; minimal hashtags (3–5 max)',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return jsonResponse({ error: 'AI service not configured' }, 500)
    }

    const body = await req.json()
    const { pillar, platform, context } = body ?? {}

    if (!pillar || !VALID_PILLARS.includes(pillar)) {
      return jsonResponse({ error: 'Invalid or missing pillar' }, 400)
    }
    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return jsonResponse({ error: 'Invalid or missing platform' }, 400)
    }

    const pillarLabel = PILLAR_LABELS[pillar] ?? pillar
    const platformNorms = PLATFORM_NORMS[platform] ?? platform

    let userPrompt = `Write content for the "${pillarLabel}" pillar on ${platform}. Match ${platform} norms: ${platformNorms}.`
    if (typeof context === 'string' && context.trim()) {
      userPrompt += ` Incorporate this nearby schedule context naturally: ${context.trim()}`
    }

    const systemPrompt = `You are a content assistant for @alymichwoo — Unfiltered Athlete: raw, real, high performance meets real life. Write in her voice: confident, authentic, athletic, editorial — never cutesy or corporate.

Respond with ONLY valid JSON in this exact shape and nothing else:
{"hook": string, "caption": string, "hashtags": string[]}

Do not wrap in markdown code fences. Do not include any text before or after the JSON.`

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('Anthropic API error:', anthropicRes.status, errText)
      return jsonResponse({ error: 'Failed to generate suggestion' }, 502)
    }

    const anthropicData = await anthropicRes.json()
    const textBlock = anthropicData.content?.find(
      (block: { type: string }) => block.type === 'text',
    )

    if (!textBlock?.text) {
      return jsonResponse({ error: 'Empty response from AI' }, 502)
    }

    const parsed = JSON.parse(stripCodeFences(textBlock.text))

    if (
      typeof parsed.hook !== 'string' ||
      typeof parsed.caption !== 'string' ||
      !Array.isArray(parsed.hashtags)
    ) {
      return jsonResponse({ error: 'Invalid suggestion format from AI' }, 502)
    }

    return jsonResponse({
      hook: parsed.hook,
      caption: parsed.caption,
      hashtags: parsed.hashtags.filter((tag: unknown) => typeof tag === 'string'),
    })
  } catch (err) {
    console.error(err)
    const message =
      err instanceof SyntaxError
        ? 'Could not parse AI response as JSON'
        : err instanceof Error
          ? err.message
          : 'Unexpected error'
    return jsonResponse({ error: message }, 500)
  }
})
