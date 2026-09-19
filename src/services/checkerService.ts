import { CHECKER_CONFIG } from '../config/checker'
import type { Category, Platform, RumourCheck, AiAssessment } from '../types'
import { buildAiAssessment } from '../utils/aiAssessment'
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

const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes TTL for demo cache
const CACHE_PREFIX = 'truthlens_ai_cache_'

export interface CheckerProgressEvent {
  stage: 'understanding' | 'signals' | 'evidence' | 'web_search' | 'reasoning' | 'assessment'
  message: string
  usedWebSearch?: boolean
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

function readAiCache(text: string, userId: string): RumourCheck | null {
  try {
    const key = `${CACHE_PREFIX}${userId}_${hashString(normalizeForCache(text))}`
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
      return parsed.check
    }
    localStorage.removeItem(key)
  } catch {
    // ignore storage error
  }
  return null
}

function writeAiCache(text: string, userId: string, check: RumourCheck): void {
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

  recentChecks(limit = 4): RumourCheck[] {
    const userId = sessionService.getCurrentUserId()
    return checkStorage
      .getChecks()
      .filter((item) => item.userId === userId)
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

    // 1. Check local session storage & short TTL cache
    const cached = readAiCache(trimmed, userId)
    if (cached) {
      await discoveryService.considerCluster(trimmed)
      return cached
    }

    const prior = checkStorage
      .getChecks()
      .find((item) => item.userId === userId && item.originalText === trimmed)
    if (prior) {
      await discoveryService.considerCluster(trimmed)
      writeAiCache(trimmed, userId, prior)
      return prior
    }

    // 2. Run deterministic risk analysis & fingerprint matching
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

    // 3. RESOLUTION HIERARCHY RULE: Existing human verified record CANNOT be overridden by AI
    if (matchedClaim && matchedClaim.verdict !== 'Unverified') {
      const isTrue = matchedClaim.verdict === 'Verified True'
      const isFalse = matchedClaim.verdict === 'Verified False'
      result = {
        label: isTrue ? 'REAL' : isFalse ? 'FAKE' : 'INCONCLUSIVE',
        verification: 'VERIFIED',
        found: true,
        aiConfidence: isTrue || isFalse ? 94 : 65,
        why: `Existing NO CAP human verification marks this claim as ${matchedClaim.verdict.toLowerCase()} (matched record ${matchedClaim.id}, ${usable!.percent}% similarity). The AI restates that ledger; it does not replace the official verdict.`,
        matchedClaimId: matchedClaim.id,
        similarityPercent: usable!.percent,
        evidenceNote: matchedClaim.evidence.length > 0
          ? `${matchedClaim.evidence.length} stored evidence item(s) on verified record.`
          : 'Human fact-checking record on file.',
        evidence: matchedClaim.evidence.map((e) => `${e.title}: ${e.description}`),
        usedWebSearch: false,
        riskLevel: analysis.riskLevel,
        riskScore: analysis.riskScore,
        riskFlags: analysis.flags,
      }
    } else {
      // 4. Call server-side OpenRouter streaming endpoint with SSE support
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

      try {
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
          throw new Error(errBody.error || `AI endpoint returned HTTP ${response.status}`)
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
                      throw new Error(data.message || 'Verification failed')
                    }
                  } catch (parseErr) {
                    if (currentEvent === 'error') throw parseErr
                  }
                }
              }
            }
          }

          if (!finalData) {
            throw new Error('Did not receive final structured result from stream')
          }

          result = {
            label: finalData.classification || 'INCONCLUSIVE',
            verification: finalData.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'UNDER VERIFICATION',
            found: isUsableMatch,
            aiConfidence: finalData.confidence || 50,
            why: finalData.reason || finalData.summary || 'NO CAP analyzed the claim and evidence signals.',
            matchedClaimId: matchedClaim?.id ?? null,
            similarityPercent: usable ? usable.percent : null,
            evidenceNote: finalData.usedWebSearch
              ? `${finalData.sources?.length || 0} live source(s) checked.`
              : isUsableMatch
                ? `${matchedClaim?.evidence.length ?? 0} stored evidence item(s) on file.`
                : 'Advisory analysis based on verifiable signals.',
            summary: finalData.summary,
            evidence: finalData.evidence,
            counterEvidence: finalData.counterEvidence,
            uncertainties: finalData.uncertainties,
            sources: finalData.sources,
            recommendedAction: finalData.recommendedAction,
            needsHumanReview: finalData.needsHumanReview,
            usedWebSearch: finalData.usedWebSearch,
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
            why: data.reason || data.summary || 'NO CAP could not establish this claim from the evidence currently available.',
            matchedClaimId: matchedClaim?.id ?? null,
            similarityPercent: usable ? usable.percent : null,
            evidenceNote: data.usedWebSearch
              ? `${data.sources?.length || 0} live source(s) checked.`
              : isUsableMatch
                ? `${matchedClaim?.evidence.length ?? 0} stored evidence item(s) on file.`
                : 'Advisory analysis based on verifiable signals.',
            summary: data.summary,
            evidence: data.evidence,
            counterEvidence: data.counterEvidence,
            uncertainties: data.uncertainties,
            sources: data.sources,
            recommendedAction: data.recommendedAction,
            needsHumanReview: data.needsHumanReview,
            usedWebSearch: data.usedWebSearch,
            riskLevel: analysis.riskLevel,
            riskScore: analysis.riskScore,
            riskFlags: analysis.flags,
            reasoningText: data.reasoningText || data.reason || data.summary,
            thinking: data.reasoningText || data.reason,
            meta: data.meta,
          }
        }
      } catch (err) {
        console.warn('AI check endpoint error, using graceful local fallback:', err)
        const localFallback = buildAiAssessment(analysis, isUsableMatch ? usable : null)
        const isNotConfigured = String(err).includes('not configured')
        result = {
          ...localFallback,
          why: isNotConfigured
            ? localFallback.why
            : 'AI analysis temporarily busy. ' + localFallback.why,
          riskLevel: analysis.riskLevel,
          riskScore: analysis.riskScore,
          riskFlags: analysis.flags,
          usedWebSearch: false,
        }
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

    checkStorage.saveChecks([record, ...checkStorage.getChecks()])
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
