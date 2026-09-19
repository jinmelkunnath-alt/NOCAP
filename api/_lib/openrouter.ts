/**
 * NO CAP OpenRouter AI Verification Service
 * Server-Side Only: Private credentials never reach the browser.
 * Uses official @openrouter/sdk with streaming, dynamic model selection, and transient failover.
 */

import { OpenRouter } from '@openrouter/sdk'

export class AiParseError extends Error {
  rawOutput?: string
  constructor(message: string, rawOutput?: string) {
    super(message)
    this.name = 'AiParseError'
    this.rawOutput = rawOutput
  }
}

export interface StructuredVerificationResult {
  classification: 'REAL' | 'FAKE' | 'INCONCLUSIVE'
  confidence: number
  verificationStatus: 'VERIFIED' | 'UNDER_VERIFICATION' | 'UNVERIFIED'
  summary: string
  reason: string
  evidence: string[]
  counterEvidence: string[]
  uncertainties: string[]
  sources: Array<{
    title: string
    url: string
    domain: string
    snippet?: string
  }>
  recommendedAction: string
  needsHumanReview: boolean
  usedWebSearch: boolean
  reasoningText?: string
  meta?: {
    modelUsed: string
    reasoningTokens?: number
    totalTokens?: number
    durationMs?: number
    reasoningText?: string
  }
}

export interface CheckClaimPayload {
  claim: string
  sourceUrl?: string | null
  platform?: string | null
  category?: string | null
  riskAnalysis?: {
    riskLevel?: string
    riskScore?: number
    flags?: string[]
    explanation?: string[]
  } | null
  matchedClaim?: {
    id: string
    verdict: string
    similarity: number
    text: string
    evidence?: Array<{ title: string; url?: string; description?: string }>
  } | null
}

export const AI_CONFIG = {
  get mainApiKey() {
    return (process.env.OPENROUTER_API_KEY || '').trim()
  },
  get mainModel() {
    return (process.env.OPENROUTER_MAIN_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free').trim()
  },
  get fastApiKey() {
    return (process.env.OPENROUTER_FAST_API_KEY || process.env.OPENROUTER_API_KEY || '').trim()
  },
  get fastModel() {
    return (process.env.OPENROUTER_FAST_MODEL || 'nvidia/nemotron-3.5-lightning:free').trim()
  },
  get siteUrl() {
    return (process.env.OPENROUTER_SITE_URL || '').trim()
  },
  get siteName() {
    return (process.env.OPENROUTER_SITE_NAME || 'NO CAP').trim()
  },
}

export function isTransientError(err: any): boolean {
  if (!err) return false
  const status = err?.status || err?.statusCode || err?.response?.status || err?.cause?.status
  if (typeof status === 'number') {
    if (status === 429 || (status >= 500 && status <= 599)) return true
    if (status >= 400 && status < 500) return false // 400, 401, 403, 404, etc.
  }
  const msg = (err?.message || String(err)).toLowerCase()
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota') || msg.includes('busy')) return true
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('504')) return true
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('econnreset') || msg.includes('network') || msg.includes('fetch failed')) return true
  return false
}

const SYSTEM_PROMPT = `You are the primary AI verification reasoning engine for NO CAP.

NO CAP is a neutral misinformation triage and verification-assistance system.

The AI checks claims, not ideologies.

For political claims:
- Remain strictly politically neutral and factual.
- Do not persuade users toward or against candidates, parties, ideologies, or political choices.
- Do not endorse or oppose candidates or legislation.
- Distinguish documented facts from opinions, allegations, and disputed claims.
- Do not infer political preferences.
- Do not use political popularity, social shares, or community votes as evidence of truth.

For health and financial claims:
- Be conservative, cautious, and clearly communicate uncertainty.

Your job:
- Analyze the factual content of the user's claim.
- Determine what the claim is asserting.
- Evaluate available evidence, risk signals, and contradictions.
- Classify strictly as: REAL, FAKE, or INCONCLUSIVE.

CRITICAL RULES:
1. AI confidence is NOT a mathematical probability that the claim is true. It is a calibrated index (0-100) of verifiable evidentiary support.
2. If the evidence is insufficient, conflicting, or uncorroborated, return INCONCLUSIVE. Never force a REAL or FAKE conclusion.
3. Never fabricate evidence, sources, URLs, statistics, quotes, official statements, or citations.
4. Human verification remains the official authority. AI output is preliminary and advisory only.
5. Provide concise, rigorous, factual explanations without bias.

You MUST respond strictly in valid JSON format matching this schema without any markdown commentary:
{
  "classification": "REAL" | "FAKE" | "INCONCLUSIVE",
  "confidence": <number between 0 and 100>,
  "verificationStatus": "VERIFIED" | "UNDER_VERIFICATION",
  "summary": "<short 1-2 sentence core finding>",
  "reason": "<short 2-3 sentence explanation of the reasoning and evidence>",
  "evidence": ["<point of supporting or context evidence>"],
  "counterEvidence": ["<point of counter evidence>"],
  "uncertainties": ["<specific missing context or unverifiable element>"],
  "recommendedAction": "<advisory action>",
  "needsHumanReview": <boolean>
}`

/**
 * Builds user prompt containing deterministic signals and contextual data
 */
function buildUserPrompt(payload: CheckClaimPayload): string {
  const parts: string[] = []

  parts.push(`USER CLAIM TO VERIFY:\n"${payload.claim.trim()}"`)

  if (payload.platform) parts.push(`Origin Platform: ${payload.platform}`)
  if (payload.category) parts.push(`Assigned Category: ${payload.category}`)
  if (payload.sourceUrl) parts.push(`Attached Source URL: ${payload.sourceUrl}`)

  if (payload.riskAnalysis) {
    parts.push(
      `Deterministic Risk Signals: Level=${payload.riskAnalysis.riskLevel || 'Unknown'} (Score=${payload.riskAnalysis.riskScore || 0}/100), Flags=[${(payload.riskAnalysis.flags || []).join(', ')}]`,
    )
  }

  if (payload.matchedClaim) {
    parts.push(
      `Existing Verified Stored Claim Record (Similarity: ${payload.matchedClaim.similarity}%): Record ID=${payload.matchedClaim.id}, Official Verdict=${payload.matchedClaim.verdict}. Stored Text: "${payload.matchedClaim.text}"`,
    )
    if (payload.matchedClaim.evidence && payload.matchedClaim.evidence.length > 0) {
      parts.push(
        `Stored Human Evidence on record: ${payload.matchedClaim.evidence.map((e) => `${e.title}: ${e.description}`).join('; ')}`,
      )
    }
  }

  parts.push('Please evaluate this claim with strict factual neutrality and return the complete structured verification assessment JSON.')

  return parts.join('\n\n')
}

/**
 * Robust JSON extraction and validation from model output
 */
export function parseAndValidateResponse(
  rawText: string,
  modelName: string,
  matchedClaim?: CheckClaimPayload['matchedClaim'],
  meta?: { reasoningTokens?: number; totalTokens?: number; durationMs?: number; reasoningText?: string },
): StructuredVerificationResult {
  let cleaned = rawText.trim()

  // Remove markdown code fences if present
  if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1').trim()
  }

  // Extract JSON object if surrounded by preamble/postscript
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch (err) {
    console.warn('Failed to parse AI JSON output. Snippet:', rawText.slice(0, 150))
    throw new AiParseError('Model output could not be parsed as structured verification JSON.', rawText)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new AiParseError('Model output did not contain a valid JSON object.', rawText)
  }

  // Validate classification
  let classification: 'REAL' | 'FAKE' | 'INCONCLUSIVE' = 'INCONCLUSIVE'
  if (parsed.classification === 'REAL' || parsed.classification === 'FAKE' || parsed.classification === 'INCONCLUSIVE') {
    classification = parsed.classification
  } else if (typeof parsed.classification === 'string') {
    const upper = parsed.classification.toUpperCase()
    if (upper.includes('REAL') || upper.includes('TRUE')) classification = 'REAL'
    else if (upper.includes('FAKE') || upper.includes('FALSE')) classification = 'FAKE'
  }

  // If matchedClaim is an existing human verified record with high confidence, respect human priority
  let verificationStatus: 'VERIFIED' | 'UNDER_VERIFICATION' | 'UNVERIFIED' = 'UNDER_VERIFICATION'
  if (
    matchedClaim &&
    matchedClaim.similarity >= 80 &&
    (matchedClaim.verdict === 'Verified True' || matchedClaim.verdict === 'Verified False')
  ) {
    verificationStatus = 'VERIFIED'
    if (matchedClaim.verdict === 'Verified True') classification = 'REAL'
    if (matchedClaim.verdict === 'Verified False') classification = 'FAKE'
  } else if (
    parsed.verificationStatus === 'VERIFIED' ||
    parsed.verificationStatus === 'UNDER_VERIFICATION' ||
    parsed.verificationStatus === 'UNVERIFIED'
  ) {
    verificationStatus = parsed.verificationStatus
  }

  // Confidence 0-100
  let confidence = typeof parsed.confidence === 'number' ? Math.round(parsed.confidence) : 50
  confidence = Math.max(10, Math.min(98, confidence))

  // Validate sources array if provided
  const sources: StructuredVerificationResult['sources'] = []
  if (Array.isArray(parsed.sources)) {
    for (const src of parsed.sources) {
      if (src && typeof src === 'object' && typeof src.url === 'string' && src.url.startsWith('http')) {
        let domain = ''
        try {
          domain = new URL(src.url).hostname.replace(/^www\./, '')
        } catch {
          domain = typeof src.domain === 'string' ? src.domain : 'web'
        }
        sources.push({
          title: typeof src.title === 'string' && src.title.trim() ? src.title.trim() : domain,
          url: src.url,
          domain,
          snippet: typeof src.snippet === 'string' ? src.snippet : undefined,
        })
      }
    }
  }

  const summary =
    typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : 'NO CAP analyzed the claim and available evidence signals.'

  const reason =
    typeof parsed.reason === 'string' && parsed.reason.trim()
      ? parsed.reason.trim()
      : 'Evidence signals and factual assertions were evaluated to provide this advisory assessment.'

  const reasoningText =
    typeof meta?.reasoningText === 'string' && meta.reasoningText.trim()
      ? meta.reasoningText.trim()
      : typeof parsed.reasoning === 'string' && parsed.reasoning.trim()
        ? parsed.reasoning.trim()
        : typeof parsed.thinking === 'string' && parsed.thinking.trim()
          ? parsed.thinking.trim()
          : reason

  return {
    classification,
    confidence,
    verificationStatus,
    summary,
    reason,
    reasoningText,
    evidence: Array.isArray(parsed.evidence)
      ? parsed.evidence.filter((e: any) => typeof e === 'string' && e.trim())
      : [],
    counterEvidence: Array.isArray(parsed.counterEvidence)
      ? parsed.counterEvidence.filter((e: any) => typeof e === 'string' && e.trim())
      : [],
    uncertainties: Array.isArray(parsed.uncertainties)
      ? parsed.uncertainties.filter((u: any) => typeof u === 'string' && u.trim())
      : [],
    sources,
    recommendedAction:
      typeof parsed.recommendedAction === 'string' && parsed.recommendedAction.trim()
        ? parsed.recommendedAction.trim()
        : 'Verify with primary sources before sharing.',
    needsHumanReview: Boolean(parsed.needsHumanReview ?? classification === 'INCONCLUSIVE'),
    usedWebSearch: false,
    meta: {
      modelUsed: modelName,
      reasoningText,
      ...meta,
    },
  }
}

export type StreamProgressCallback = (event: {
  stage: 'understanding' | 'signals' | 'evidence' | 'reasoning' | 'assessment'
  message: string
  thinkingChunk?: string
  accumulatedThinking?: string
}) => void

interface ModelCandidate {
  model: string
  apiKey: string
  isBackup: boolean
}

/**
 * Execute OpenRouter claim check with streaming and transient fallback
 */
export async function runOpenRouterCheck(
  payload: CheckClaimPayload,
  onProgress?: StreamProgressCallback,
): Promise<StructuredVerificationResult> {
  const startTime = Date.now()

  // 1. Stage: Understanding
  onProgress?.({
    stage: 'understanding',
    message: 'Understanding the claim and context',
  })

  // 2. Stage: Signals
  onProgress?.({
    stage: 'signals',
    message: 'Evaluating deterministic risk triage and signals',
  })

  // 3. Stage: Evidence
  onProgress?.({
    stage: 'evidence',
    message: 'Cross-referencing verified records and known patterns',
  })

  const userPrompt = buildUserPrompt(payload)

  // Configure attempts: Primary (OPENROUTER_MAIN_MODEL) -> Backup (OPENROUTER_FAST_MODEL)
  const candidates: ModelCandidate[] = []

  const mainKey = AI_CONFIG.mainApiKey
  const mainModel = AI_CONFIG.mainModel

  if (mainKey) {
    candidates.push({
      model: mainModel,
      apiKey: mainKey,
      isBackup: false,
    })
  }

  const fastKey = AI_CONFIG.fastApiKey
  const fastModel = AI_CONFIG.fastModel

  if (fastKey && fastModel && (fastModel !== mainModel || fastKey !== mainKey)) {
    candidates.push({
      model: fastModel,
      apiKey: fastKey,
      isBackup: true,
    })
  }

  if (candidates.length === 0) {
    throw new Error('NO CAP AI is not configured. OPENROUTER_API_KEY environment variable is missing.')
  }

  let lastError: Error | null = null

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    try {
      const client = new OpenRouter({
        apiKey: candidate.apiKey,
        httpReferer: AI_CONFIG.siteUrl || undefined,
        appTitle: AI_CONFIG.siteName || 'NO CAP',
      })

      onProgress?.({
        stage: 'reasoning',
        message: candidate.isBackup
          ? `Evaluating with backup model (${candidate.model})`
          : 'Evaluating evidence & logical certainty',
      })

      // Standard chat request configuration compatible with OpenRouter free models
      const chatRequest: any = {
        model: candidate.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
        temperature: 0.15,
      }

      // Execute streaming send via OpenRouter SDK
      const response = await client.chat.send({
        chatRequest,
      })

      let accumulatedContent = ''
      let accumulatedReasoning = ''
      let reasoningTokens: number | undefined
      let totalTokens: number | undefined

      // Stream response chunks
      if (response && Symbol.asyncIterator in Object(response)) {
        const stream = response as AsyncIterable<any>
        for await (const chunk of stream) {
          if (chunk.error) {
            throw new Error(`OpenRouter stream error: ${chunk.error.message || chunk.error.code}`)
          }

          const delta = chunk.choices?.[0]?.delta?.content
          if (delta) {
            accumulatedContent += delta
          }

          // Capture reasoning / thinking deltas if supported by model
          const reasoningDelta =
            chunk.choices?.[0]?.delta?.reasoning ||
            chunk.choices?.[0]?.delta?.reasoning_content ||
            chunk.choices?.[0]?.delta?.thought
          if (reasoningDelta) {
            accumulatedReasoning += reasoningDelta
            onProgress?.({
              stage: 'reasoning',
              message: 'Evaluating evidence & logical certainty',
              thinkingChunk: reasoningDelta,
              accumulatedThinking: accumulatedReasoning,
            })
          }

          if (chunk.usage) {
            totalTokens = chunk.usage.totalTokens
            if (chunk.usage.completionTokensDetails?.reasoningTokens) {
              reasoningTokens = chunk.usage.completionTokensDetails.reasoningTokens
            }
          }
        }
      } else {
        // Non-streaming response
        const result = response as any
        accumulatedContent = result.choices?.[0]?.message?.content || ''
        accumulatedReasoning =
          result.choices?.[0]?.message?.reasoning ||
          result.choices?.[0]?.message?.reasoning_content ||
          ''
      }

      if (!accumulatedContent.trim()) {
        throw new Error(`OpenRouter model ${candidate.model} returned empty response content`)
      }

      onProgress?.({
        stage: 'assessment',
        message: 'Synthesizing structured assessment',
      })

      const durationMs = Date.now() - startTime
      const structured = parseAndValidateResponse(
        accumulatedContent,
        candidate.model,
        payload.matchedClaim,
        {
          reasoningTokens,
          totalTokens,
          durationMs,
          reasoningText: accumulatedReasoning,
        },
      )

      return structured
    } catch (err: any) {
      console.error(`Error attempting OpenRouter model ${candidate.model}:`, err?.message || err)
      lastError = err instanceof Error ? err : new Error(String(err))

      // Only failover to backup if error is a genuine transient condition and another candidate exists
      const hasNextCandidate = i + 1 < candidates.length
      if (hasNextCandidate && isTransientError(err)) {
        console.warn(`Transient failure on ${candidate.model}. Retrying with backup model ${candidates[i + 1].model}...`)
        continue
      }

      // Non-transient errors (auth, bad request, parse error) or exhausted candidates throw immediately
      throw lastError
    }
  }

  throw lastError || new Error('NO CAP AI could not complete this check.')
}
