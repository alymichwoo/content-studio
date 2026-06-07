import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Duplicates src/lib/constants.js — Deno Edge Functions cannot import the Vite client bundle.
const VALID_PILLARS = ['train', 'live', 'think', 'feel', 'fuel'] as const
const VALID_PLATFORMS = ['tiktok', 'instagram', 'linkedin'] as const
const VALID_POST_TYPES = ['reel', 'carousel', 'story', 'static', 'video'] as const

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

const ANTHROPIC_MODEL = 'claude-sonnet-4-6'

type BatchSuggestion = {
  scheduled_date: string
  pillar: string
  platforms: string[]
  post_type: string
  title: string
  hook: string
  caption: string
  notes: string
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

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate
}

/** Concatenate only text blocks from a multi-block Anthropic response (web_search path). */
function extractTextFromContent(
  content: Array<{ type: string; text?: string }> | undefined,
): string {
  if (!Array.isArray(content)) return ''
  return content
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
}

function validateBatchSuggestion(
  item: unknown,
  startDate: string,
  endDate: string,
): BatchSuggestion | null {
  if (!item || typeof item !== 'object') return null

  const row = item as Record<string, unknown>
  const {
    scheduled_date,
    pillar,
    platforms,
    post_type,
    title,
    hook,
    caption,
    notes,
  } = row

  if (
    !isIsoDate(scheduled_date) ||
    !isDateInRange(scheduled_date, startDate, endDate) ||
    typeof pillar !== 'string' ||
    !VALID_PILLARS.includes(pillar as (typeof VALID_PILLARS)[number]) ||
    !Array.isArray(platforms) ||
    platforms.length === 0 ||
    !platforms.every(
      (p) =>
        typeof p === 'string' &&
        VALID_PLATFORMS.includes(p as (typeof VALID_PLATFORMS)[number]),
    ) ||
    typeof post_type !== 'string' ||
    !VALID_POST_TYPES.includes(post_type as (typeof VALID_POST_TYPES)[number]) ||
    typeof title !== 'string' ||
    !title.trim() ||
    typeof hook !== 'string' ||
    !hook.trim() ||
    typeof caption !== 'string' ||
    !caption.trim() ||
    typeof notes !== 'string' ||
    !notes.trim()
  ) {
    return null
  }

  return {
    scheduled_date,
    pillar,
    platforms: platforms as string[],
    post_type,
    title: title.trim(),
    hook: hook.trim(),
    caption: caption.trim(),
    notes: notes.trim(),
  }
}

function buildBatchSystemPrompt(): string {
  const pillars = VALID_PILLARS.join(' | ')
  const platforms = VALID_PLATFORMS.join(' | ')
  const postTypes = VALID_POST_TYPES.join(' | ')

  return `You are a content strategist for @alymichwoo — Unfiltered Athlete: raw, real, high-performance content at the intersection of CrossFit, lifestyle, AI, and human performance.

Brand voice: confident, athletic, editorial — never cutesy, never corporate.

Content pillars (use ONLY these exact strings): ${pillars}
Platforms (use ONLY these exact strings in the platforms array): ${platforms}
Post types (use ONLY these exact strings): ${postTypes}

Use the web_search tool to look up CURRENT trends, trending formats, and viral video concepts relevant to fitness, CrossFit, and lifestyle creators. Ground ideas in what is working now.

For each idea's "notes" field (1–3 sentences total):
- Name the current trend or format the idea riffs on in plain language, and explain in one or two sentences why it fits this creator's brand and the dates/schedule (e.g. "Rides the serialized 'come with me' travel-story format popular on Reels right now; timed to build anticipation for the Austin qualifier.").
- Do NOT invent statistics, percentages, engagement numbers, or "top-performing / highest-performing per X" claims.
- Do NOT attribute claims to named tools, blogs, or reports as if they were data authorities, and do not mischaracterize what a source is. If something is currently trending, say so generally rather than citing a specific source you may not have actually read.
- Keep notes concise: 1 to 3 sentences.

Your FINAL response must be ONLY valid JSON — no markdown fences, no commentary — a JSON array of objects with this exact shape:
{
  "scheduled_date": "YYYY-MM-DD",
  "pillar": "<pillar>",
  "platforms": ["<platform>", ...],
  "post_type": "<post_type>",
  "title": "...",
  "hook": "...",
  "caption": "...",
  "notes": "..."
}`
}

function buildBatchUserPrompt(params: {
  startDate: string
  endDate: string
  targetCount: number
  recentPosts: unknown[]
  scheduleItems: unknown[]
  existingPosts: unknown[]
}): string {
  const { startDate, endDate, targetCount, recentPosts, scheduleItems, existingPosts } = params

  return `Generate exactly ${targetCount} content ideas distributed across the date range ${startDate} to ${endDate} (inclusive).

Requirements:
- Assign each idea a scheduled_date (YYYY-MM-DD) within that range.
- Distribute new ideas across the range, preferring days with NO existing post.
- Aim for at most one new idea per day while open days are still available.
- Only place a new idea on a day that already has a post (from existing_posts or from another idea you are generating) if every day in the range is taken and the target count still is not met.
- Vary pillars and platforms across the set — do not cluster on one pillar or platform.
- Avoid repeating pillars, topics, or angles already covered in recent_posts and existing_posts.
- If a schedule_item falls within the range, lean into it (e.g. competition → behind-the-scenes prep or recap; travel → on-the-road content; launch → build-up or announcement).
- Where a current trend fits, riff on it in the idea itself and reflect it in notes per the notes field rules (plain-language trend name, brand/schedule fit, no fabricated stats or authoritative source citations).

recent_posts (anti-repetition context):
${JSON.stringify(recentPosts, null, 2)}

existing_posts (days that already have content planned in this range):
${JSON.stringify(existingPosts, null, 2)}

schedule_items (calendar context in range):
${JSON.stringify(scheduleItems, null, 2)}

Return ONLY the JSON array. No markdown. No text before or after the array.`
}

const BATCH_MAX_RETRIES = 2
const BATCH_RETRY_DELAY_MS = 6000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getAnthropicRetryDelayMs(res: Response): number {
  const retryAfter = res.headers.get('retry-after')
  if (!retryAfter) return BATCH_RETRY_DELAY_MS

  const seconds = Number(retryAfter)
  if (!Number.isNaN(seconds) && seconds > 0) {
    return seconds * 1000
  }

  const retryAt = Date.parse(retryAfter)
  if (!Number.isNaN(retryAt)) {
    const delay = retryAt - Date.now()
    if (delay > 0) return delay
  }

  return BATCH_RETRY_DELAY_MS
}

async function fetchAnthropicBatch(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response> {
  let lastRes: Response | null = null

  for (let attempt = 0; attempt <= BATCH_MAX_RETRIES; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    lastRes = res
    if (res.ok) return res

    const retryable = res.status === 429 || res.status === 529
    if (retryable && attempt < BATCH_MAX_RETRIES) {
      const delay = getAnthropicRetryDelayMs(res)
      console.warn(
        `Anthropic ${res.status} (generate_batch), retrying in ${delay}ms (attempt ${attempt + 1}/${BATCH_MAX_RETRIES})`,
      )
      await sleep(delay)
      continue
    }

    return res
  }

  return lastRes!
}

async function handleGenerateBatch(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const { start_date, end_date, target_count, recent_posts, schedule_items, existing_posts } =
    body

  if (!isIsoDate(start_date) || !isIsoDate(end_date)) {
    return jsonResponse({ error: 'Invalid or missing start_date / end_date (YYYY-MM-DD)' }, 400)
  }
  if (start_date > end_date) {
    return jsonResponse({ error: 'start_date must be on or before end_date' }, 400)
  }

  const targetCount = Number(target_count)
  if (!Number.isInteger(targetCount) || targetCount < 1) {
    return jsonResponse({ error: 'target_count must be a positive integer' }, 400)
  }

  const recentPosts = Array.isArray(recent_posts) ? recent_posts : []
  const scheduleItems = Array.isArray(schedule_items) ? schedule_items : []
  const existingPosts = Array.isArray(existing_posts) ? existing_posts : []

  const anthropicRes = await fetchAnthropicBatch(apiKey, {
    model: ANTHROPIC_MODEL,
    max_tokens: 8192,
    system: buildBatchSystemPrompt(),
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }],
    messages: [
      {
        role: 'user',
        content: buildBatchUserPrompt({
          startDate: start_date,
          endDate: end_date,
          targetCount,
          recentPosts,
          scheduleItems,
          existingPosts,
        }),
      },
    ],
  })

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text()
    console.error('Anthropic API error (generate_batch):', anthropicRes.status, errText)
    if (anthropicRes.status === 429 || anthropicRes.status === 529) {
      return jsonResponse({ error: 'Rate limited — try again in a moment.' })
    }
    return jsonResponse({ error: 'Failed to generate batch suggestions' }, 502)
  }

  const anthropicData = await anthropicRes.json()
  const rawText = extractTextFromContent(anthropicData.content)

  if (!rawText.trim()) {
    return jsonResponse({ error: 'Empty response from AI', raw: '' })
  }

  const stripped = stripCodeFences(rawText)

  let parsed: unknown
  try {
    parsed = JSON.parse(stripped)
  } catch {
    return jsonResponse({
      error: 'Could not parse AI response as JSON',
      raw: rawText,
    })
  }

  if (!Array.isArray(parsed)) {
    return jsonResponse({
      error: 'AI response is not a JSON array',
      raw: rawText,
    })
  }

  const suggestions = parsed
    .map((item) => validateBatchSuggestion(item, start_date, end_date))
    .filter((item): item is BatchSuggestion => item !== null)

  if (suggestions.length === 0) {
    return jsonResponse({
      error: 'No valid suggestions after validation',
      raw: rawText,
    })
  }

  return jsonResponse({ suggestions })
}

async function handleSingleSuggest(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const { pillar, platform, context } = body

  if (!pillar || !VALID_PILLARS.includes(pillar as (typeof VALID_PILLARS)[number])) {
    return jsonResponse({ error: 'Invalid or missing pillar' }, 400)
  }
  if (!platform || !VALID_PLATFORMS.includes(platform as (typeof VALID_PLATFORMS)[number])) {
    return jsonResponse({ error: 'Invalid or missing platform' }, 400)
  }

  const pillarLabel = PILLAR_LABELS[pillar as string] ?? pillar
  const platformNorms = PLATFORM_NORMS[platform as string] ?? platform

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
      model: ANTHROPIC_MODEL,
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

    const body = (await req.json()) as Record<string, unknown>

    if (body?.mode === 'generate_batch') {
      return await handleGenerateBatch(apiKey, body)
    }

    return await handleSingleSuggest(apiKey, body)
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
