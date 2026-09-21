/**
 * NO CAP Server-Side AI Client
 * Model: google/gemma-4-31b-it
 * Provider: NVIDIA NIM API
 * Server-Side Only: Private credentials never reach the browser.
 */

export interface AiCheckContext {
  category?: string
  platform?: string
  risk?: string
  riskFlags?: string[]
  matchedClaims?: Array<{
    id: string
    verdict: string
    similarity: number
    text: string
  }>
}

export interface AiCheckResult {
  classification: 'REAL' | 'FAKE' | 'INCONCLUSIVE'
  confidence: number
  verificationStatus: 'VERIFIED' | 'UNDER_VERIFICATION'
  summary: string
  reason: string
  evidence: Array<{ title: string; url?: string; description: string }>
  uncertainties: string[]
  recommendedAction: 'POST_TO_COMMUNITY' | 'VIEW_VERIFICATION' | 'NONE'
}

export interface AiEnhanceResult {
  enhancedText: string
}

export interface AiSynthesizeInput {
  claim: string
  comments: Array<{ text: string; perspective?: string }>
  pollResults?: Record<string, number>
  votes?: { agree: number; disagree: number }
  existingEvidence?: Array<{ title: string; url?: string; description: string }>
  risk?: { riskLevel?: string; flags?: string[] }
}

export interface AiSynthesizeResult {
  classification: 'REAL' | 'FAKE' | 'INCONCLUSIVE'
  confidence: number
  summary: string
  supportingSignals: string[]
  counterSignals: string[]
  communitySummary: string
}

export const NVIDIA_CONFIG = {
  get apiKey(): string {
    return (process.env.NVIDIA_API_KEY || '').trim()
  },
  model: 'google/gemma-4-31b-it',
  endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
}

const SYSTEM_PROMPT = `You are NO CAP's AI assistant powered by Gemma.
Analyze user claims with rigorous neutrality, factual accuracy, and evidentiary discipline.

RULES:
1. Remain strictly politically neutral.
2. Never invent evidence, sources, or URLs.
3. Clearly communicate uncertainty.
4. Output strictly valid JSON without preamble or markdown wrapping.`

async function callNvidiaGemma(userPrompt: string, systemPromptOverride?: string): Promise<string | null> {
  const apiKey = NVIDIA_CONFIG.apiKey
  if (!apiKey) return null

  const response = await fetch(NVIDIA_CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: NVIDIA_CONFIG.model,
      messages: [
        { role: 'system', content: systemPromptOverride || SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    console.error(`[NO CAP AI] NVIDIA NIM API Error (${response.status}):`, errorText.slice(0, 300))
    throw new Error(`NVIDIA API call failed with status ${response.status}`)
  }

  const data = (await response.json()) as any
  let content = data?.choices?.[0]?.message?.content || null
  if (content) {
    // Strip code fences if present
    content = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1').trim()
  }
  return content
}

export const aiClient = {
  isConfigured(): boolean {
    return Boolean(NVIDIA_CONFIG.apiKey)
  },

  async enhanceText(originalText: string): Promise<AiEnhanceResult> {
    const prompt = `Improve the grammar, clarity, and readability of this rumour/claim for fact-checking.
RULES:
- Improve grammar and syntax.
- Preserve the user's exact original meaning.
- DO NOT add external facts, evidence, or bias.
- DO NOT make the claim stronger or weaker.
- Return ONLY valid JSON: { "enhancedText": "..." }

Original text: "${originalText}"`

    try {
      const raw = await callNvidiaGemma(prompt)
      if (raw) {
        const firstBrace = raw.indexOf('{')
        const lastBrace = raw.lastIndexOf('}')
        const jsonStr = firstBrace !== -1 && lastBrace !== -1 ? raw.substring(firstBrace, lastBrace + 1) : raw
        const parsed = JSON.parse(jsonStr)
        if (parsed?.enhancedText && typeof parsed.enhancedText === 'string') {
          return { enhancedText: parsed.enhancedText.trim() }
        }
      }
    } catch (err) {
      console.warn('[NO CAP AI] Enhance with Gemma failed, using deterministic formatter:', err)
    }

    return { enhancedText: aiClient.fallbackEnhanceText(originalText) }
  },

  fallbackEnhanceText(text: string): string {
    let cleaned = text.trim()
    cleaned = cleaned.replace(/^(?:is\s+it\s+true\s+that|is\s+it\s+true|did\s+someone\s+say\s+that|rumour:\s*|rumor:\s*)/i, '').trim()
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    }
    cleaned = cleaned.replace(/\brbi\b/gi, 'RBI')
    cleaned = cleaned.replace(/\bwho\b/g, 'WHO')
    if (!/[.?!]$/.test(cleaned)) {
      cleaned += '.'
    }
    return cleaned
  },

  async synthesizeCommunity(input: AiSynthesizeInput): Promise<AiSynthesizeResult> {
    const prompt = `Synthesize community discourse for this claim:
Claim: "${input.claim}"
Comments count: ${input.comments.length}
Comments sample: ${JSON.stringify(input.comments.slice(0, 15))}
Votes: ${JSON.stringify(input.votes || {})}
Poll results: ${JSON.stringify(input.pollResults || {})}
Existing Evidence: ${JSON.stringify(input.existingEvidence || [])}

RULES:
- Community majority does NOT equal truth! Explicitly state that consensus alone does not establish factual truth.
- Summarize supporting arguments, counterarguments, and key uncertainties.
- Keep the summary to 2-3 sentences.
- Output ONLY valid JSON:
{
  "classification": "REAL | FAKE | INCONCLUSIVE",
  "confidence": <integer 20-85>,
  "summary": "<1-2 sentence overview>",
  "supportingSignals": ["<signal 1>", "<signal 2>"],
  "counterSignals": ["<signal 1>", "<signal 2>"],
  "communitySummary": "<2-3 sentence balanced community evidence summary>"
}`

    try {
      const raw = await callNvidiaGemma(prompt)
      if (raw) {
        const firstBrace = raw.indexOf('{')
        const lastBrace = raw.lastIndexOf('}')
        const jsonStr = firstBrace !== -1 && lastBrace !== -1 ? raw.substring(firstBrace, lastBrace + 1) : raw
        const parsed = JSON.parse(jsonStr)
        return {
          classification: ['REAL', 'FAKE', 'INCONCLUSIVE'].includes(parsed.classification)
            ? parsed.classification
            : 'INCONCLUSIVE',
          confidence: typeof parsed.confidence === 'number' ? Math.max(20, Math.min(90, Math.round(parsed.confidence))) : 50,
          summary: String(parsed.summary || 'Community synthesis completed.'),
          supportingSignals: Array.isArray(parsed.supportingSignals) ? parsed.supportingSignals : [],
          counterSignals: Array.isArray(parsed.counterSignals) ? parsed.counterSignals : [],
          communitySummary: String(parsed.communitySummary || 'Community discussion has been synthesized.'),
        }
      }
    } catch (err) {
      console.warn('[NO CAP AI] Synthesize with Gemma failed, using heuristic synthesis:', err)
    }

    return aiClient.fallbackSynthesize(input)
  },

  fallbackSynthesize(input: AiSynthesizeInput): AiSynthesizeResult {
    const agree = input.votes?.agree ?? 0
    const disagree = input.votes?.disagree ?? 0
    const totalVotes = agree + disagree
    const commentsCount = input.comments.length

    const supportingSignals: string[] = []
    const counterSignals: string[] = []

    for (const c of input.comments) {
      const text = c.text.toLowerCase()
      if (/(fake|scam|false|hoax|no\s+evidence|debunked|circular)/i.test(text)) {
        counterSignals.push(c.text)
      } else if (/(true|confirmed|verified|happening|got\s+one|received)/i.test(text)) {
        supportingSignals.push(c.text)
      }
    }

    let classification: 'REAL' | 'FAKE' | 'INCONCLUSIVE' = 'INCONCLUSIVE'
    let summary = 'Community opinion remains mixed or uncorroborated.'

    if (counterSignals.length > supportingSignals.length && disagree >= agree) {
      classification = 'FAKE'
      summary = 'Multiple community participants cite missing official circulars and contradictory accounts.'
    } else if (supportingSignals.length > counterSignals.length && agree > disagree && (input.existingEvidence?.length ?? 0) > 0) {
      classification = 'REAL'
      summary = 'Community contributors noted corroborating references, though official review remains pending.'
    }

    const majorityNotice = totalVotes > 0 && Math.max(agree, disagree) / totalVotes > 0.7
      ? 'Most community responses currently lean in one direction, but community consensus alone does not establish factual truth. '
      : 'Community sentiment is divided. '

    const communitySummary = `${majorityNotice}${commentsCount} contributor statement(s) and ${totalVotes} vote(s) were analyzed. Stored evidence remains advisory until an official review is locked.`

    return {
      classification,
      confidence: classification === 'INCONCLUSIVE' ? 44 : 68,
      summary,
      supportingSignals: supportingSignals.slice(0, 3),
      counterSignals: counterSignals.slice(0, 3),
      communitySummary,
    }
  },

  async calculateSimilarity(text: string, candidates: string[]): Promise<Array<{ text: string; similarity: number; percent: number }>> {
    return candidates.map((candidate) => {
      const sim = calculateTokenSimilarity(text, candidate)
      return {
        text: candidate,
        similarity: sim,
        percent: Math.round(sim * 100),
      }
    })
  },
}

function calculateTokenSimilarity(a: string, b: string): number {
  const normA = a.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean)
  const normB = b.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (normA.length === 0 || normB.length === 0) return 0

  const setA = new Set(normA)
  const setB = new Set(normB)
  let intersection = 0
  for (const token of setA) {
    if (setB.has(token)) intersection += 1
  }
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : Number((intersection / union).toFixed(4))
}
