/**
 * NO CAP — NVIDIA NIM AI Verification Service
 * Model: google/gemma-4-31b-it
 * Endpoint: https://integrate.api.nvidia.com/v1/chat/completions
 * Server-Side Only: Private NVIDIA credentials NEVER reach the browser.
 */

export class AiParseError extends Error {
  rawOutput?: string
  constructor(message: string, rawOutput?: string) {
    super(message)
    this.name = 'AiParseError'
    this.rawOutput = rawOutput
  }
}

export class AiConfigurationError extends Error {
  constructor(message = 'NVIDIA_API_KEY is not configured on the server.') {
    super(message)
    this.name = 'AiConfigurationError'
  }
}

export class AiServiceError extends Error {
  statusCode: number
  errorType: 'AUTH_ERROR' | 'UNAVAILABLE' | 'CLIENT_ERROR'
  constructor(message: string, statusCode: number, errorType: 'AUTH_ERROR' | 'UNAVAILABLE' | 'CLIENT_ERROR') {
    super(message)
    this.name = 'AiServiceError'
    this.statusCode = statusCode
    this.errorType = errorType
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

export const NVIDIA_CONFIG = {
  get apiKey(): string {
    return (process.env.NVIDIA_API_KEY || '').trim()
  },
  model: 'google/gemma-4-31b-it',
  endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
  temperature: 0.5,
  top_p: 1,
  max_tokens: 1024,
  stream: false,
}

export const GEMMA_SYSTEM_PROMPT = `You are NO CAP's misinformation assessment AI powered by Gemma.

Your mission:
Analyze submitted claims with rigorous factual neutrality and evidentiary discipline.
Assess claims, not people's political beliefs or ideologies.

MANDATORY RULES:
1. Political Neutrality:
   - For political claims, remain strictly factual and objective.
   - Do NOT recommend candidates or political parties.
   - Do NOT persuade users politically or tell users how to vote.
   - Do NOT rank candidates or parties.
   - Do NOT infer voting preferences or advocate an ideology.
   - Distinguish documented facts from allegations, opinions, and policy disputes.

2. Evidentiary Discipline & Honesty:
   - Distinguish verified evidence from assumptions.
   - Clearly communicate uncertainty.
   - Do NOT fabricate sources, URLs, quotes, statistics, studies, or official announcements.
   - Do NOT pretend to have live-browsed the web.
   - If verifiable evidence is insufficient, conflicting, or uncorroborated, you MUST return "INCONCLUSIVE". Honest uncertainty is always preferred over unsupported certainty.

3. Context Signals & Authority:
   - Treat deterministic risk flags (e.g., Sensational, Shouting, Unsourced) as triage signals, NOT as proof that a claim is false. High Risk != False.
   - Community votes are social signals; never treat community sentiment as definitive truth.
   - Stored human reviews represent official NO CAP authority; AI assessment is preliminary and advisory.
   - When an existing matched human-verified record is provided in the prompt, synthesize its findings faithfully.

4. Output Format:
   You MUST return ONLY a valid JSON object matching this exact schema without any conversational preamble or markdown wrapping:
{
  "classification": "REAL" | "FAKE" | "INCONCLUSIVE",
  "confidence": <integer between 0 and 100>,
  "verificationStatus": "VERIFIED" | "UNDER_VERIFICATION",
  "summary": "<1-2 sentence core factual finding>",
  "reason": "<2-3 sentence concise explanation of the reasoning and evidence>",
  "reasoningText": "<detailed step-by-step reasoning evaluating the claim's claims, known facts, and evidence>",
  "evidence": ["<specific factual point supporting or contextualizing the claim>"],
  "counterEvidence": ["<specific factual point contradicting the claim>"],
  "uncertainties": ["<specific unverified aspect, missing citation, or need for human corroboration>"],
  "recommendedAction": "<practical advice, e.g., 'Verify with primary records before sharing.'>",
  "needsHumanReview": <boolean>
}`

/**
 * Builds user prompt containing the claim and deterministic signals
 */
export function buildGemmaUserPrompt(payload: CheckClaimPayload): string {
  const parts: string[] = []

  parts.push(`CLAIM TO VERIFY:\n"${payload.claim.trim()}"`)

  if (payload.category) parts.push(`Assigned Category: ${payload.category}`)
  if (payload.platform) parts.push(`Reported Platform: ${payload.platform}`)
  if (payload.sourceUrl) parts.push(`Attached Source URL: ${payload.sourceUrl}`)

  if (payload.riskAnalysis) {
    const flags = (payload.riskAnalysis.flags || []).join(', ') || 'None'
    parts.push(
      `Deterministic Risk Signals:\n- Risk Level: ${payload.riskAnalysis.riskLevel || 'Unknown'}\n- Risk Score: ${payload.riskAnalysis.riskScore ?? 0}/100\n- Flags: [${flags}] (Note: Triage signals indicate caution, not falsity)`,
    )
  }

  if (payload.matchedClaim) {
    parts.push(
      `Existing Matched Claim on Ledger:\n- Record ID: ${payload.matchedClaim.id}\n- Stored Verdict: ${payload.matchedClaim.verdict}\n- Similarity: ${payload.matchedClaim.similarity}%\n- Stored Text: "${payload.matchedClaim.text}"`,
    )
    if (payload.matchedClaim.evidence && payload.matchedClaim.evidence.length > 0) {
      const evList = payload.matchedClaim.evidence
        .map((e) => `- ${e.title}: ${e.description || ''}`)
        .join('\n')
      parts.push(`Stored Evidence from Human Reviewers:\n${evList}`)
    }
  }

  parts.push(
    'Evaluate this claim with strict factual accuracy, political neutrality, and evidence-based reasoning. Return ONLY the structured verification JSON.',
  )

  return parts.join('\n\n')
}

/**
 * Robust JSON extraction and validation from Gemma model output
 */
export function parseAndValidateGemmaResponse(
  rawText: string,
  modelName: string,
  matchedClaim?: CheckClaimPayload['matchedClaim'],
  meta?: { reasoningTokens?: number; totalTokens?: number; durationMs?: number; extractedThought?: string },
): StructuredVerificationResult {
  let cleaned = (rawText || '').trim()

  // Extract thought tags if present (e.g. <thought>...</thought>)
  let extractedThought = meta?.extractedThought || ''
  const thoughtMatch = cleaned.match(/<thought>([\s\S]*?)<\/thought>/i)
  if (thoughtMatch) {
    extractedThought = thoughtMatch[1].trim()
    cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim()
  }

  // Remove markdown code fences if present
  if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1').trim()
  }

  // Extract outermost JSON object
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.warn('Failed to parse Gemma output as JSON. Snippet:', rawText.slice(0, 150))
    throw new AiParseError('Gemma output could not be parsed as structured verification JSON.', rawText)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new AiParseError('Gemma response did not contain a valid JSON object.', rawText)
  }

  // Validate and normalize classification
  let classification: 'REAL' | 'FAKE' | 'INCONCLUSIVE' = 'INCONCLUSIVE'
  const rawClass = String(parsed.classification || '').toUpperCase()
  if (rawClass === 'REAL' || rawClass === 'TRUE') {
    classification = 'REAL'
  } else if (rawClass === 'FAKE' || rawClass === 'FALSE' || rawClass === 'MISLEADING') {
    classification = 'FAKE'
  } else {
    classification = 'INCONCLUSIVE'
  }

  // If high-confidence matched human review exists on the ledger, align official status
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

  // Validate confidence (0-100 numeric)
  let confidence = typeof parsed.confidence === 'number' ? Math.round(parsed.confidence) : 50
  if (isNaN(confidence)) confidence = 50
  confidence = Math.max(0, Math.min(100, confidence))

  // Validate summary & reason
  const summary =
    typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : 'NO CAP analyzed the claim and available evidence signals.'

  const reason =
    typeof parsed.reason === 'string' && parsed.reason.trim()
      ? parsed.reason.trim()
      : 'Evidence signals and factual assertions were evaluated by Gemma.'

  const reasoningText =
    typeof parsed.reasoningText === 'string' && parsed.reasoningText.trim()
      ? parsed.reasoningText.trim()
      : extractedThought ||
        (typeof parsed.reasoning === 'string' && parsed.reasoning.trim() ? parsed.reasoning.trim() : reason)

  // Validate evidence arrays
  const evidence: string[] = Array.isArray(parsed.evidence)
    ? parsed.evidence.filter((e: any) => typeof e === 'string' && e.trim())
    : []

  const counterEvidence: string[] = Array.isArray(parsed.counterEvidence)
    ? parsed.counterEvidence.filter((c: any) => typeof c === 'string' && c.trim())
    : []

  const uncertainties: string[] = Array.isArray(parsed.uncertainties)
    ? parsed.uncertainties.filter((u: any) => typeof u === 'string' && u.trim())
    : []

  // Validate sources array
  const sources: StructuredVerificationResult['sources'] = []
  if (Array.isArray(parsed.sources)) {
    for (const src of parsed.sources) {
      if (src && typeof src === 'object' && typeof src.url === 'string' && src.url.startsWith('http')) {
        let domain = ''
        try {
          domain = new URL(src.url).hostname.replace(/^www\./, '')
        } catch {
          domain = typeof src.domain === 'string' ? src.domain : 'source'
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

  const recommendedAction =
    typeof parsed.recommendedAction === 'string' && parsed.recommendedAction.trim()
      ? parsed.recommendedAction.trim()
      : 'Verify with primary sources before sharing.'

  const needsHumanReview = Boolean(parsed.needsHumanReview ?? classification === 'INCONCLUSIVE')

  return {
    classification,
    confidence,
    verificationStatus,
    summary,
    reason,
    reasoningText,
    evidence,
    counterEvidence,
    uncertainties,
    sources,
    recommendedAction,
    needsHumanReview,
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

/**
 * Execute NVIDIA NIM Gemma 4 31B IT claim check.
 * NEVER returns synthetic or canned mock AI results.
 * If NVIDIA API is unconfigured or fails, throws an honest error.
 */
export async function runNvidiaGemmaCheck(
  payload: CheckClaimPayload,
  onProgress?: StreamProgressCallback,
): Promise<StructuredVerificationResult> {
  const startTime = Date.now()

  // 1. Stage: Understanding
  onProgress?.({
    stage: 'understanding',
    message: 'Analyzing claim text and origin context',
  })

  // 2. Stage: Signals
  onProgress?.({
    stage: 'signals',
    message: 'Evaluating deterministic risk triage and signals',
  })

  // 3. Stage: Evidence
  onProgress?.({
    stage: 'evidence',
    message: payload.matchedClaim
      ? `Cross-referencing verified claim record (${payload.matchedClaim.similarity}% match)`
      : 'Cross-referencing verified records and factual knowledge',
  })

  // Validate API key presence
  const apiKey = NVIDIA_CONFIG.apiKey
  if (!apiKey) {
    console.warn('NVIDIA_API_KEY is not configured on the server.')
    throw new AiConfigurationError('NO CAP AI is not configured. NVIDIA_API_KEY environment variable is missing.')
  }

  const userPrompt = buildGemmaUserPrompt(payload)

  onProgress?.({
    stage: 'reasoning',
    message: 'Submitting claim to NVIDIA Gemma 4 31B IT...',
  })

  const requestBody = {
    model: NVIDIA_CONFIG.model,
    messages: [
      { role: 'system', content: GEMMA_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: NVIDIA_CONFIG.max_tokens,
    temperature: NVIDIA_CONFIG.temperature,
    top_p: NVIDIA_CONFIG.top_p,
    frequency_penalty: 0,
    presence_penalty: 0,
    seed: 0,
    stream: false,
  }

  // Safe logging
  console.log('[NO CAP AI] NVIDIA request initiated:', {
    model: NVIDIA_CONFIG.model,
    hasApiKey: Boolean(apiKey),
    endpoint: NVIDIA_CONFIG.endpoint,
  })

  let response: Response
  try {
    response = await fetch(NVIDIA_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(45000), // 45s timeout
    })
  } catch (err: any) {
    console.error('[NO CAP AI] NVIDIA API network or timeout error:', err?.message || err)
    if (err?.name === 'TimeoutError' || String(err).includes('timeout')) {
      throw new AiServiceError('NO CAP AI timed out waiting for NVIDIA response.', 504, 'UNAVAILABLE')
    }
    throw new AiServiceError('NO CAP AI provider could not be reached.', 503, 'UNAVAILABLE')
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    console.error(`[NO CAP AI] NVIDIA NIM API error (HTTP ${response.status}):`, errorBody.slice(0, 300))

    if (response.status === 401 || response.status === 403) {
      throw new AiServiceError(
        'NO CAP AI authentication failed. Please verify the NVIDIA API key.',
        401,
        'AUTH_ERROR',
      )
    }
    if (response.status === 429) {
      throw new AiServiceError(
        'NO CAP AI is temporarily rate limited. Please try again in a moment.',
        429,
        'UNAVAILABLE',
      )
    }
    if (response.status >= 500) {
      throw new AiServiceError(
        'NO CAP AI provider is temporarily unavailable.',
        503,
        'UNAVAILABLE',
      )
    }

    throw new AiServiceError(
      `NO CAP AI request failed with status ${response.status}`,
      response.status,
      'UNAVAILABLE',
    )
  }

  let data: any
  try {
    data = await response.json()
  } catch {
    throw new AiParseError('NVIDIA response could not be parsed as valid JSON.')
  }

  const choice = data?.choices?.[0]
  if (!choice || !choice.message) {
    console.error('[NO CAP AI] Malformed NVIDIA response structure:', JSON.stringify(data).slice(0, 300))
    throw new AiParseError('NVIDIA API returned a malformed response without choices.')
  }

  const rawContent = choice.message.content || ''
  if (!rawContent.trim()) {
    throw new AiParseError('NVIDIA Gemma 4 returned an empty response.')
  }

  onProgress?.({
    stage: 'assessment',
    message: 'Validating Gemma verification assessment...',
  })

  const durationMs = Date.now() - startTime
  const totalTokens = data?.usage?.total_tokens
  const reasoningTokens = data?.usage?.completion_tokens_details?.reasoning_tokens

  const structured = parseAndValidateGemmaResponse(
    rawContent,
    NVIDIA_CONFIG.model,
    payload.matchedClaim,
    {
      totalTokens,
      reasoningTokens,
      durationMs,
      extractedThought: choice.message.reasoning || choice.message.thought,
    },
  )

  console.log('[NO CAP AI] NVIDIA Gemma 4 check completed successfully in', durationMs, 'ms')
  return structured
}
