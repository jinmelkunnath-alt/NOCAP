/**
 * NO CAP OpenRouter AI Verification Service
 * Server-Side Only: Private credentials never reach the browser.
 * Uses official @openrouter/sdk with streaming, reasoning, web search plugin, and fast fallback.
 */

import { OpenRouter } from '@openrouter/sdk'

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
  get webSearchEnabled() {
    return process.env.OPENROUTER_WEB_SEARCH_ENABLED !== 'false'
  },
  get maxWebResults() {
    const parsed = Number(process.env.OPENROUTER_WEB_SEARCH_MAX_RESULTS)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5
  },
  get siteUrl() {
    return (process.env.OPENROUTER_SITE_URL || '').trim()
  },
  get siteName() {
    return (process.env.OPENROUTER_SITE_NAME || 'NO CAP').trim()
  },
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
- Evaluate available evidence and contradictions.
- Classify strictly as: REAL, FAKE, or INCONCLUSIVE.

CRITICAL RULES:
1. AI confidence is NOT a mathematical probability that the claim is true. It is a calibration of available verifiable signal density.
2. If the evidence is insufficient, conflicting, or uncorroborated, return INCONCLUSIVE. Never force a REAL or FAKE conclusion.
3. Never fabricate evidence, sources, URLs, statistics, quotes, official statements, or search results.
4. Human verification remains the official authority. Community votes are sentiment only.
5. If live web search was used, cite real sources returned. If not used, do not fabricate web sources.

You MUST respond strictly in valid JSON format matching this schema without any markdown commentary:
{
  "classification": "REAL" | "FAKE" | "INCONCLUSIVE",
  "confidence": <number between 0 and 100>,
  "verificationStatus": "VERIFIED" | "UNDER_VERIFICATION" | "UNVERIFIED",
  "summary": "<short 1-2 sentence core finding>",
  "reason": "<short 2-3 sentence explanation of the reasoning and evidence>",
  "evidence": ["<point of supporting or context evidence>"],
  "counterEvidence": ["<point of counter evidence>"],
  "uncertainties": ["<specific missing context or unverifiable element>"],
  "sources": [
    { "title": "<source title>", "url": "<source url>", "domain": "<domain.com>", "snippet": "<snippet>" }
  ],
  "recommendedAction": "<advisory action>",
  "needsHumanReview": <boolean>,
  "usedWebSearch": <boolean>
}`

/**
 * Heuristic to detect if fresh or time-sensitive internet data is required
 */
export function requiresWebSearch(text: string, category?: string | null): boolean {
  if (!text) return false
  const lower = text.toLowerCase()

  const timePatterns = [
    /\b(today|yesterday|tomorrow|this week|this month|recent|recently|just announced|just happened)\b/i,
    /\b(breaking|current price|new policy|latest update|live now|newly released|leaked today)\b/i,
    /\b(announced|signed|passed law|death|passed away|elected|resigned|arrested|fired)\b/i,
    /\b(2025|2026)\b/i,
    /\b(stock price|market crash|ceo announcement|earthquake|storm|outage|shut down)\b/i,
  ]

  const matchesTime = timePatterns.some((pattern) => pattern.test(lower))
  const isNewsCategory =
    category === 'Politics' || category === 'Economy' || category === 'Disaster' || category === 'Official'

  return matchesTime || isNewsCategory
}

/**
 * Builds user prompt containing deterministic signals and contextual data
 */
function buildUserPrompt(payload: CheckClaimPayload, shouldSearch: boolean): string {
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

  if (shouldSearch) {
    parts.push('Note: Fresh web search is enabled for this query to verify current information.')
  } else {
    parts.push('Note: General knowledge query; fresh web search is not required.')
  }

  parts.push('Please return the complete structured verification assessment JSON.')

  return parts.join('\n\n')
}

/**
 * Robust JSON extraction and validation from model output
 */
export function parseAndValidateResponse(
  rawText: string,
  modelName: string,
  usedWebSearch: boolean,
  matchedClaim?: CheckClaimPayload['matchedClaim'],
  meta?: { reasoningTokens?: number; totalTokens?: number; durationMs?: number; reasoningText?: string },
): StructuredVerificationResult {
  let cleaned = rawText.trim()

  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
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
  } catch {
    console.warn('Failed to parse AI JSON output directly. Fallback recovery triggered. Snippet:', rawText.slice(0, 150))
    return {
      classification: 'INCONCLUSIVE',
      confidence: 45,
      verificationStatus: 'UNDER_VERIFICATION',
      summary: 'NO CAP could not conclusively establish this claim from the available evidence.',
      reason: 'The automated analysis was inconclusive or returned unformatted evidence. Human fact-checking review is recommended.',
      evidence: [],
      counterEvidence: [],
      uncertainties: ['Insufficient formatted data returned from verification engine.'],
      sources: [],
      recommendedAction: 'Exercise caution and verify with official primary sources.',
      needsHumanReview: true,
      usedWebSearch,
      meta: {
        modelUsed: modelName,
        ...meta,
      },
    }
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
  if (matchedClaim && matchedClaim.similarity >= 80 && (matchedClaim.verdict === 'Verified True' || matchedClaim.verdict === 'Verified False')) {
    verificationStatus = 'VERIFIED'
    if (matchedClaim.verdict === 'Verified True') classification = 'REAL'
    if (matchedClaim.verdict === 'Verified False') classification = 'FAKE'
  } else if (parsed.verificationStatus === 'VERIFIED' || parsed.verificationStatus === 'UNDER_VERIFICATION' || parsed.verificationStatus === 'UNVERIFIED') {
    verificationStatus = parsed.verificationStatus
  }

  // Confidence 0-100
  let confidence = typeof parsed.confidence === 'number' ? Math.round(parsed.confidence) : 50
  confidence = Math.max(10, Math.min(98, confidence))

  // Validate sources array
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

  const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
    ? parsed.summary.trim()
    : 'NO CAP analyzed the claim and available evidence signals.'

  const reason = typeof parsed.reason === 'string' && parsed.reason.trim()
    ? parsed.reason.trim()
    : 'Available official sources and evidence were cross-checked to provide this advisory assessment.'

  const reasoningText = typeof meta?.reasoningText === 'string' && meta.reasoningText.trim()
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
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence.filter((e: any) => typeof e === 'string' && e.trim()) : [],
    counterEvidence: Array.isArray(parsed.counterEvidence) ? parsed.counterEvidence.filter((e: any) => typeof e === 'string' && e.trim()) : [],
    uncertainties: Array.isArray(parsed.uncertainties) ? parsed.uncertainties.filter((u: any) => typeof u === 'string' && u.trim()) : [],
    sources,
    recommendedAction: typeof parsed.recommendedAction === 'string' && parsed.recommendedAction.trim()
      ? parsed.recommendedAction.trim()
      : 'Verify with primary sources before sharing.',
    needsHumanReview: Boolean(parsed.needsHumanReview ?? (classification === 'INCONCLUSIVE')),
    usedWebSearch: Boolean(parsed.usedWebSearch ?? (usedWebSearch && sources.length > 0)),
    meta: {
      modelUsed: modelName,
      reasoningText,
      ...meta,
    },
  }
}

export type StreamProgressCallback = (event: {
  stage: 'understanding' | 'signals' | 'evidence' | 'web_search' | 'reasoning' | 'assessment'
  message: string
  usedWebSearch?: boolean
  thinkingChunk?: string
  accumulatedThinking?: string
}) => void

interface ModelCandidate {
  model: string
  apiKey: string
  isBackup: boolean
}

/**
 * Execute OpenRouter claim check with streaming, model fallback, and web plugin
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
    message: 'Reviewing verification signals and risk triage',
  })

  const shouldSearch = AI_CONFIG.webSearchEnabled && requiresWebSearch(payload.claim, payload.category)
  
  if (shouldSearch) {
    onProgress?.({
      stage: 'web_search',
      message: 'Checking current information and live web sources',
      usedWebSearch: true,
    })
  } else {
    onProgress?.({
      stage: 'evidence',
      message: 'Analyzing available stored evidence and knowledge',
      usedWebSearch: false,
    })
  }

  const userPrompt = buildUserPrompt(payload, shouldSearch)

  // Configure attempts: Primary (Nemotron Super) -> Fast/Backup (Nemotron Lightning)
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
          : 'Cross-checking evidence & evaluating certainty',
      })

      // Build chat plugins
      const plugins: any[] = []
      if (shouldSearch) {
        plugins.push({
          id: 'web',
          maxResults: AI_CONFIG.maxWebResults,
        })
      }

      // Configure OpenRouter chat request
      const chatRequest: any = {
        model: candidate.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
        temperature: 0.15,
        responseFormat: { type: 'json_object' },
        reasoning: {
          effort: 'medium',
        },
      }

      if (plugins.length > 0) {
        chatRequest.plugins = plugins
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
          const delta = chunk.choices?.[0]?.delta?.content
          if (delta) {
            accumulatedContent += delta
          }
          
          // Capture reasoning / thinking deltas from OpenRouter
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
        // Non-streaming fallback object
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
        message: 'Preparing structured assessment',
      })

      const durationMs = Date.now() - startTime
      const structured = parseAndValidateResponse(
        accumulatedContent,
        candidate.model,
        shouldSearch,
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
      // Continue to backup model if available
    }
  }

  // If all candidate models failed
  throw lastError || new Error('NO CAP AI could not complete this check.')
}
