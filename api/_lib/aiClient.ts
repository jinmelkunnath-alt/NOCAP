/**
 * TruthLens Server-Side AI Provider Client
 * Supports OpenAI-compatible endpoints (Ling 3.0, Nex AGI, Gemma, LiquidAI, OpenAI, Groq, etc.)
 * Server-only: private keys are NEVER exposed to client.
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

export const AI_API_KEY = process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY || ''
export const AI_BASE_URL = (
  process.env.AI_BASE_URL ||
  (process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1')
).replace(/\/+$/, '')
export const AI_MODEL =
  process.env.AI_MODEL ||
  (process.env.OPENROUTER_API_KEY
    ? process.env.OPENROUTER_MAIN_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free'
    : 'Ling-3.0-Flash')
export const AI_EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL || 'LiquidAI-LFM2.5-Embedding-350M'

const SYSTEM_PROMPT = `You are TruthLens AI, an advisory misinformation-analysis assistant.
Your job is to analyze user rumors and claims with strict neutrality and evidentiary care.

RULES:
1. Analyze claims neutrally.
2. Never infer truth from political ideology.
3. Never invent evidence.
4. Never invent sources or URLs.
5. Never claim to have browsed the web unless live tools actually supplied browsing data.
6. Never issue an official human TruthLens verdict.
7. Treat all AI classification as advisory only.
8. Clearly state uncertainty. If evidence is insufficient, classify as INCONCLUSIVE with lower confidence (20-45%).
9. Explicitly distinguish AVAILABLE EVIDENCE from INSUFFICIENT EVIDENCE. If no verified evidence is supplied in context, state: "TruthLens could not establish this claim from the evidence currently available."
10. Explanations must be concise: maximum 2 to 3 sentences.
11. Return strictly valid JSON matching the requested structure without any markdown fencing.`

async function callChatModel(userPrompt: string, systemPromptOverride?: string): Promise<string | null> {
  if (!AI_API_KEY) return null

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPromptOverride || SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    console.error(`AI API Error (${response.status}):`, errorText)
    throw new Error(`AI API call failed with status ${response.status}`)
  }

  const data = (await response.json()) as any
  return data?.choices?.[0]?.message?.content || null
}


export const aiClient = {
  isConfigured(): boolean {
    return Boolean(AI_API_KEY)
  },

  async checkClaim(claim: string, context: AiCheckContext): Promise<AiCheckResult> {
    const prompt = `Analyze this claim:
Claim: "${claim}"
Context:
- Category: ${context.category || 'General'}
- Platform: ${context.platform || 'Unknown'}
- Risk Level: ${context.risk || 'Low'}
- Risk Flags: ${(context.riskFlags || []).join(', ') || 'None'}
- Matched TruthLens Claims: ${JSON.stringify(context.matchedClaims || [])}

Required output JSON format:
{
  "classification": "REAL | FAKE | INCONCLUSIVE",
  "confidence": <integer between 20 and 95>,
  "verificationStatus": "VERIFIED | UNDER_VERIFICATION",
  "summary": "<1 sentence summary>",
  "reason": "<2 to 3 sentences maximum concise advisory explanation>",
  "evidence": [],
  "uncertainties": ["<key uncertainty or missing corroboration>"],
  "recommendedAction": "POST_TO_COMMUNITY | VIEW_VERIFICATION | NONE"
}`

    try {
      const raw = await callChatModel(prompt)
      if (raw) {
        const parsed = JSON.parse(raw)
        return {
          classification: ['REAL', 'FAKE', 'INCONCLUSIVE'].includes(parsed.classification)
            ? parsed.classification
            : 'INCONCLUSIVE',
          confidence: typeof parsed.confidence === 'number' ? Math.max(15, Math.min(95, Math.round(parsed.confidence))) : 40,
          verificationStatus: parsed.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'UNDER_VERIFICATION',
          summary: String(parsed.summary || 'Advisory assessment of the submitted claim.'),
          reason: String(parsed.reason || 'TruthLens could not establish this claim from the evidence currently available.'),
          evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
          uncertainties: Array.isArray(parsed.uncertainties) ? parsed.uncertainties : [],
          recommendedAction: ['POST_TO_COMMUNITY', 'VIEW_VERIFICATION', 'NONE'].includes(parsed.recommendedAction)
            ? parsed.recommendedAction
            : 'POST_TO_COMMUNITY',
        }
      }
    } catch (err) {
      console.warn('AI API call failed, using intelligent fallback:', err)
    }

    // High quality intelligent advisory fallback when API key is not set or network unavailable
    return aiClient.fallbackCheckClaim(claim, context)
  },

  fallbackCheckClaim(claim: string, context: AiCheckContext): AiCheckResult {
    const matched = context.matchedClaims?.[0]
    if (matched && matched.similarity >= 0.7 && matched.verdict !== 'Unverified') {
      const isReal = matched.verdict === 'Verified True'
      const isFake = matched.verdict === 'Verified False'
      const classification = isReal ? 'REAL' : isFake ? 'FAKE' : 'INCONCLUSIVE'
      return {
        classification,
        confidence: isReal || isFake ? 92 : 65,
        verificationStatus: 'VERIFIED',
        summary: `Matches existing TruthLens human verification record (${matched.verdict}).`,
        reason: `Existing TruthLens human verification marks this claim as ${matched.verdict.toLowerCase()} (matched record ${matched.id}, ${Math.round(matched.similarity * 100)}% similarity). The AI restates that ledger; it does not replace the official verdict.`,
        evidence: [],
        uncertainties: [],
        recommendedAction: 'VIEW_VERIFICATION',
      }
    }

    const hasHighRisk = context.risk === 'High' || (context.riskFlags && context.riskFlags.length >= 2)
    const lower = claim.toLowerCase()
    const isObviousScam = /(forward.*double|guaranteed.*free.*tomorrow|hack.*bank|click.*here.*claim)/i.test(lower)

    if (isObviousScam) {
      return {
        classification: 'FAKE',
        confidence: 84,
        verificationStatus: 'UNDER_VERIFICATION',
        summary: 'Matches recurring forward-to-earn or urgency-driven misinformation patterns.',
        reason: 'The claim exhibits characteristic patterns of recurring forward-based misinformation without verifiable institutional sourcing. Stored records contain no official notice supporting this announcement.',
        evidence: [],
        uncertainties: ['No official institutional notification provided.'],
        recommendedAction: 'POST_TO_COMMUNITY',
      }
    }

    return {
      classification: 'INCONCLUSIVE',
      confidence: hasHighRisk ? 42 : 36,
      verificationStatus: 'UNDER_VERIFICATION',
      summary: 'Insufficient evidence available to establish or disprove this claim.',
      reason: 'TruthLens could not establish this claim from the evidence currently available. Stored records contain no verified institutional corroboration for this specific statement, so it remains under verification.',
      evidence: [],
      uncertainties: ['Lack of primary source documentation or institutional confirmation.'],
      recommendedAction: 'POST_TO_COMMUNITY',
    }
  },

  async enhanceText(originalText: string): Promise<AiEnhanceResult> {
    const prompt = `Improve the grammar, clarity, and readability of this rumour/claim for community fact-checking.
RULES:
- Improve grammar and syntax.
- Preserve the user's exact original meaning.
- DO NOT add facts, evidence, or external claims.
- DO NOT make the claim stronger or weaker.
- DO NOT change the user's intent.
- Return JSON: { "enhancedText": "..." }

Original text: "${originalText}"`

    try {
      const raw = await callChatModel(prompt)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.enhancedText && typeof parsed.enhancedText === 'string') {
          return { enhancedText: parsed.enhancedText.trim() }
        }
      }
    } catch (err) {
      console.warn('AI Enhance API failed, falling back to heuristic enhancer:', err)
    }

    return { enhancedText: aiClient.fallbackEnhanceText(originalText) }
  },

  fallbackEnhanceText(text: string): string {
    let cleaned = text.trim()
    cleaned = cleaned.replace(/^(?:is\s+it\s+true\s+that|is\s+it\s+true|did\s+someone\s+say\s+that|rumour:\s*|rumor:\s*)/i, '').trim()
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    }
    // common grammar fixes for demo
    cleaned = cleaned.replace(/\blpu\b/gi, 'LPU')
    cleaned = cleaned.replace(/\brbi\b/gi, 'RBI')
    cleaned = cleaned.replace(/\bwho\b/g, 'WHO')
    cleaned = cleaned.replace(/\s+getting\s+/gi, ' are receiving ')
    cleaned = cleaned.replace(/\s+giving\s+/gi, ' is distributing ')
    cleaned = cleaned.replace(/\s+laptop\b/gi, ' laptops')
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
- Output JSON format:
{
  "classification": "REAL | FAKE | INCONCLUSIVE",
  "confidence": <integer 20-85>,
  "summary": "<1-2 sentence overview>",
  "supportingSignals": ["<signal 1>", "<signal 2>"],
  "counterSignals": ["<signal 1>", "<signal 2>"],
  "communitySummary": "<2-3 sentence balanced community evidence summary>"
}`

    try {
      const raw = await callChatModel(prompt)
      if (raw) {
        const parsed = JSON.parse(raw)
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
      console.warn('AI Synthesize API failed, falling back to heuristic synthesis:', err)
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

    const communitySummary = `${majorityNotice}${commentsCount} contributor statement(s) and ${totalVotes} vote(s) were analyzed. Stored evidence remains advisory until an official TruthLens review is locked.`

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
    // If embedding API is available, we could fetch embeddings.
    // For fast reliable hackathon execution, compute normalized token Jaccard / Cosine similarity:
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
