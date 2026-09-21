import { CHECKER_CONFIG } from '../config/checker'
import type { Category, Platform, RumourCheck, AiAssessment } from '../types'
import { enhanceClaimText, stripQuestionWrapper } from '../utils/enhanceText'
import { fingerprintClaim } from '../utils/fingerprint'
import { createId } from '../utils/format'
import { checkStorage } from './checkStorage'
import { claimService } from './claimService'
import { discoveryService, clusterIdFor } from './discoveryService'
import { emitSocialChanged } from './dataEvents'
import { fingerprintService } from './fingerprintService'
import { riskService } from './riskService'
import { sessionService } from './sessionService'
import { storageService } from './storageService'

const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes TTL
const CACHE_PREFIX = 'truthlens_ai_cache_'

export type CheckerErrorType = 'NOT_CONFIGURED' | 'AUTH_ERROR' | 'PARSE_ERROR' | 'UNAVAILABLE'

export function extractSafeErrorMessage(data: any, fallback = 'NO CAP AI is currently unavailable.'): string {
  if (!data) return fallback
  if (typeof data === 'string' && data.trim() && data.trim() !== '[object Object]') {
    return data.trim()
  }
  if (data instanceof Error && data.message && data.message !== '[object Object]') {
    return data.message.trim()
  }
  if (typeof data.message === 'string' && data.message.trim() && data.message !== '[object Object]') {
    return data.message.trim()
  }
  if (typeof data.error === 'string' && data.error.trim() && data.error !== '[object Object]') {
    return data.error.trim()
  }
  if (data.error && typeof data.error === 'object') {
    if (typeof data.error.message === 'string' && data.error.message.trim() && data.error.message !== '[object Object]') {
      return data.error.message.trim()
    }
    if (typeof data.error.detail === 'string' && data.error.detail.trim()) {
      return data.error.detail.trim()
    }
  }
  if (data.details && typeof data.details === 'object') {
    if (typeof data.details.message === 'string' && data.details.message.trim() && data.details.message !== '[object Object]') {
      return data.details.message.trim()
    }
  }
  if (typeof data.detail === 'string' && data.detail.trim()) {
    return data.detail.trim()
  }
  if (typeof data.title === 'string' && data.title.trim()) {
    return data.title.trim()
  }
  return fallback
}

export class CheckerError extends Error {
  errorType: CheckerErrorType
  constructor(message: string, errorType: CheckerErrorType) {
    super(extractSafeErrorMessage(message))
    this.name = 'CheckerError'
    this.errorType = errorType
  }
}

export interface CheckerProgressEvent {
  stage: 'understanding' | 'signals' | 'evidence' | 'reasoning' | 'assessment'
  message: string
  thinkingChunk?: string
  accumulatedThinking?: string
}

function hashString(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

function normalizeForCache(text: string): string {
  return stripQuestionWrapper(text).toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isLegacyCannedCheck(check: RumourCheck): boolean {
  const why = check.result?.why || ''
  const model = check.result?.meta?.modelUsed || ''
  if (check.result?.aiConfidence === 36 && why.includes('NO CAP did not find a stored rumour')) {
    return true
  }
  if (why.includes('AI analysis temporarily busy') && !model) {
    return true
  }
  return false
}

function readAiCache(text: string, userId: string): RumourCheck | null {
  try {
    const key = `${CACHE_PREFIX}${userId}_${hashString(normalizeForCache(text))}`
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
      if (parsed.check && !isLegacyCannedCheck(parsed.check)) {
        return parsed.check
      }
    }
    localStorage.removeItem(key)
  } catch {
    // ignore storage error
  }
  return null
}

function writeAiCache(text: string, userId: string, check: RumourCheck): void {
  if (isLegacyCannedCheck(check)) return
  try {
    const key = `${CACHE_PREFIX}${userId}_${hashString(normalizeForCache(text))}`
    localStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        check,
      }),
    )
  } catch {
    // ignore quota error
  }
}

function inferCategory(text: string): Category {
  const lower = text.toLowerCase()
  if (/(laptop|campus|lpu|student|school|university|hostel|exam|results|placement)/.test(lower)) return 'Campus'
  if (/(vaccine|doctor|health|virus|5g|diabetes|who|cure|remedy|hospital|medicine)/.test(lower)) return 'Health'
  if (/(rbi|bank|crypto|sebi|upi|tax|nav|rupee|investment|scam|balance)/.test(lower)) return 'Finance'
  if (/(election|ballot|government|census|ban|minister|parliament|law|vote)/.test(lower)) return 'Politics'
  if (/(app|ai|phone|software|tech|hacked|password|update)/.test(lower)) return 'Technology'
  if (/(film|celebrity|actor|clone|movie|trailer|star)/.test(lower)) return 'Entertainment'
  return 'Other'
}

export const checkerService = {
  enhance(text: string): string {
    return enhanceClaimText(text)
  },

  async enhanceAsync(text: string): Promise<string> {
    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalText: text }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.enhancedText && typeof data.enhancedText === 'string') {
          return data.enhancedText
        }
      }
    } catch {
      // fallback to deterministic
    }
    return enhanceClaimText(text)
  },

  inferCategory,

  getCached(text: string): RumourCheck | null {
    const userId = sessionService.getCurrentUserId()
    return readAiCache(text, userId)
  },

  recentChecks(limit = 4): RumourCheck[] {
    const userId = sessionService.getCurrentUserId()
    return checkStorage
      .getChecks()
      .filter((item) => item.userId === userId && !isLegacyCannedCheck(item))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  },

  async check(
    text: string,
    onProgress?: (event: CheckerProgressEvent) => void,
  ): Promise<RumourCheck> {
    const trimmed = text.trim()
    if (trimmed.length < 8) throw new Error('Enter a rumour or question of at least 8 characters.')
    const userId = sessionService.getCurrentUserId()

    // 1. Run deterministic risk analysis & fingerprint matching
    onProgress?.({
      stage: 'understanding',
      message: 'Understanding the claim and context',
    })

    const analysis = riskService.analyzeClaimSync(trimmed, '')
    const claims = storageService.getStoredClaims()
    const match = fingerprintService.findBestMatch(stripQuestionWrapper(trimmed), claims)
    const usable =
      match && match.similarity >= CHECKER_CONFIG.foundSimilarity
        ? match
        : fingerprintService.findBestMatch(trimmed, claims)

    const isUsableMatch = Boolean(usable && usable.similarity >= CHECKER_CONFIG.foundSimilarity)
    const matchedClaim = isUsableMatch ? usable!.claim : null

    onProgress?.({
      stage: 'signals',
      message: `Analyzing risk signals (${analysis.riskLevel} risk)`,
    })

    let result: AiAssessment

    // 2. Call server-side AI endpoint with SSE streaming support
    const payload = {
      claim: trimmed,
      sourceUrl: null,
      platform: 'Other',
      category: inferCategory(trimmed),
      riskAnalysis: {
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        flags: analysis.flags,
        explanation: analysis.explanation,
      },
      matchedClaim: matchedClaim
        ? {
            id: matchedClaim.id,
            verdict: matchedClaim.verdict,
            similarity: usable!.similarity,
            text: matchedClaim.text,
            evidence: matchedClaim.evidence,
          }
        : null,
    }

      const response = await fetch('/api/ai/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream, application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        const errorType: CheckerErrorType =
          errBody.errorType || (response.status === 422 ? 'PARSE_ERROR' : response.status === 401 ? 'AUTH_ERROR' : 'UNAVAILABLE')
        const safeMessage = extractSafeErrorMessage(errBody, `AI endpoint returned HTTP ${response.status}`)
        throw new CheckerError(safeMessage, errorType)
      }

      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let finalData: any = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          let currentEvent = 'message'
          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.replace('event:', '').trim()
            } else if (line.startsWith('data:')) {
              const dataStr = line.replace('data:', '').trim()
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr)
                  if (currentEvent === 'progress') {
                    onProgress?.(data)
                  } else if (currentEvent === 'result') {
                    finalData = data
                  } else if (currentEvent === 'error') {
                    const errType: CheckerErrorType = data.errorType || 'UNAVAILABLE'
                    const safeMessage = extractSafeErrorMessage(data, 'AI verification failed')
                    throw new CheckerError(safeMessage, errType)
                  }
                } catch (parseErr) {
                  if (parseErr instanceof CheckerError) throw parseErr
                  if (currentEvent === 'error') throw parseErr
                }
              }
            }
          }
        }

        if (!finalData) {
          throw new CheckerError('Did not receive structured verification assessment from AI engine.', 'PARSE_ERROR')
        }

        result = {
          label: finalData.classification || 'INCONCLUSIVE',
          verification: finalData.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'UNDER VERIFICATION',
          found: isUsableMatch,
          aiConfidence: typeof finalData.confidence === 'number' ? finalData.confidence : 50,
          why: finalData.reason || finalData.summary || 'NO CAP analyzed the claim and evidence signals.',
          matchedClaimId: matchedClaim?.id ?? null,
          similarityPercent: usable ? usable.percent : null,
          evidenceNote: isUsableMatch
            ? `${matchedClaim?.evidence.length ?? 0} stored evidence item(s) on file.`
            : 'Advisory analysis based on verifiable signals.',
          summary: finalData.summary,
          evidence: finalData.evidence,
          counterEvidence: finalData.counterEvidence,
          uncertainties: finalData.uncertainties,
          sources: finalData.sources,
          recommendedAction: finalData.recommendedAction,
          needsHumanReview: finalData.needsHumanReview,
          usedWebSearch: false,
          riskLevel: analysis.riskLevel,
          riskScore: analysis.riskScore,
          riskFlags: analysis.flags,
          reasoningText: finalData.reasoningText || finalData.reason || finalData.summary,
          thinking: finalData.reasoningText || finalData.reason,
          meta: finalData.meta,
        }
      } else {
        // Standard JSON response
        const data = await response.json()
        result = {
          label: data.classification || 'INCONCLUSIVE',
          verification: data.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'UNDER VERIFICATION',
          found: isUsableMatch,
          aiConfidence: typeof data.confidence === 'number' ? data.confidence : 50,
          why: data.reason || data.summary || 'NO CAP analyzed the claim and evidence signals.',
          matchedClaimId: matchedClaim?.id ?? null,
          similarityPercent: usable ? usable.percent : null,
          evidenceNote: isUsableMatch
            ? `${matchedClaim?.evidence.length ?? 0} stored evidence item(s) on file.`
            : 'Advisory analysis based on verifiable signals.',
          summary: data.summary,
          evidence: data.evidence,
          counterEvidence: data.counterEvidence,
          uncertainties: data.uncertainties,
          sources: data.sources,
          recommendedAction: data.recommendedAction,
          needsHumanReview: data.needsHumanReview,
          usedWebSearch: false,
          riskLevel: analysis.riskLevel,
          riskScore: analysis.riskScore,
          riskFlags: analysis.flags,
          reasoningText: data.reasoningText || data.reason || data.summary,
          thinking: data.reasoningText || data.reason,
          meta: data.meta,
        }
      }

    const record: RumourCheck = {
      id: createId('chk'),
      userId,
      originalText: trimmed,
      fingerprint: fingerprintClaim(stripQuestionWrapper(trimmed)),
      clusterId: clusterIdFor(trimmed),
      createdAt: new Date().toISOString(),
      postedClaimId: null,
      result,
    }

    checkStorage.saveChecks([record, ...checkStorage.getChecks().filter((c) => !isLegacyCannedCheck(c))])
    writeAiCache(trimmed, userId, record)
    await discoveryService.considerCluster(trimmed)
    emitSocialChanged()
    return record
  },

  async publish(input: {
    originalText: string
    displayText: string
    enhancedByAI: boolean
    category: Category
    platform: Platform
    sourceUrl: string
    checkId?: string
  }) {
    if (input.checkId) {
      const existingCheck = checkStorage.getChecks().find((item) => item.id === input.checkId)
      if (existingCheck?.postedClaimId) {
        const posted = storageService
          .getStoredClaims()
          .find((item) => item.id === existingCheck.postedClaimId)
        if (posted) return posted
      }
    }
    const claim = await claimService.createClaim({
      text: input.displayText.trim(),
      sourceUrl: input.sourceUrl.trim(),
      platform: input.platform,
      category: input.category,
      originalText: input.originalText.trim(),
      enhancedByAI: input.enhancedByAI,
      originType: 'USER',
      uploadType: 'user',
    })
    if (input.checkId) {
      checkStorage.saveChecks(
        checkStorage.getChecks().map((item) =>
          item.id === input.checkId ? { ...item, postedClaimId: claim.id } : item,
        ),
      )
    }
    emitSocialChanged()
    return claim
  },
}
