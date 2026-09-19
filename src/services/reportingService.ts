import type {
  Claim,
  IncidentAuditEvent,
  IncidentEvidenceItem,
  IncidentReport,
  IncidentSnapshot,
  IncidentTimelineStep,
  Review,
} from '../types'
import { createId } from '../utils/format'
import { verificationPath } from '../utils/verificationPath'
import { courtroomService } from './courtroomService'
import { emitSocialChanged } from './dataEvents'
import { ledgerService } from './ledgerService'
import { reportingStorage } from './reportingStorage'
import { sessionService } from './sessionService'
import { socialService } from './socialService'
import { storageService } from './storageService'

function nextIncidentId(existing: IncidentReport[]): string {
  const year = 2026
  let max = 0
  for (const item of existing) {
    const match = /^TL-INC-(\d{4})-(\d+)$/.exec(item.incidentId)
    if (match && Number(match[1]) === year) {
      max = Math.max(max, Number(match[2]))
    }
  }
  return `TL-INC-${year}-${String(max + 1).padStart(4, '0')}`
}

function audit(
  kind: IncidentAuditEvent['kind'],
  actorId: string,
  note: string,
): IncidentAuditEvent {
  return {
    id: createId('aud'),
    at: new Date().toISOString(),
    kind,
    actorId,
    note,
  }
}

function evidenceItems(claim: Claim): IncidentEvidenceItem[] {
  const items: IncidentEvidenceItem[] = []
  for (const item of claim.evidence) {
    items.push({
      title: item.title || 'Reviewer-supplied evidence',
      type: 'SOURCE',
      reference: item.url,
      description: item.description || 'Attached by a reviewer.',
      addedBy: claim.reviewerId || 'reviewer',
      createdAt: claim.updatedAt,
      classification: 'reviewer-provided',
    })
  }
  for (const item of claim.candidateSources ?? []) {
    items.push({
      title: item.title || 'Candidate source',
      type: 'CANDIDATE_SOURCE',
      reference: item.url,
      description: item.description || 'Needs human review.',
      addedBy: 'intake',
      createdAt: claim.createdAt,
      classification: 'candidate-source',
    })
  }
  for (const item of courtroomService.userEvidenceFor(claim.id)) {
    items.push({
      title: item.title,
      type: item.type,
      reference: item.reference,
      description: item.explanation,
      addedBy: item.authorId || 'community',
      createdAt: item.createdAt,
      classification: 'user-contributed',
    })
  }
  const board = courtroomService.boardForClaim(claim.id)
  for (const item of board) {
    if (item.type === 'USER_CONTRIBUTION' || item.type === 'CANDIDATE_SOURCE') continue
    if (items.some((row) => row.reference === item.reference && row.title === item.title)) continue
    items.push({
      title: item.title,
      type: item.type,
      reference: item.reference,
      description: item.explanation,
      addedBy: item.authorId || 'system',
      createdAt: item.createdAt,
      classification: 'courtroom-context',
    })
  }
  return items
}

function timelineFor(claim: Claim, reviews: Review[]): IncidentTimelineStep[] {
  const ledger = ledgerService.forClaim(claim.id)
  const steps: IncidentTimelineStep[] = []
  if (ledger.length > 0) {
    for (const entry of ledger) {
      const labels: Record<typeof entry.kind, string> = {
        submitted: 'Claim submitted',
        risk_analysis: 'Risk analyzed',
        fingerprint_check: 'Fingerprint check',
        routed: 'Routed for review',
        fingerprint_reuse: 'Fingerprint reuse',
        reviewer_decision: entry.perspective
          ? `Reviewer perspective ${entry.perspective}`
          : 'Reviewer decision',
        consensus_reached: 'Consensus reached',
        consensus_not_reached: 'Consensus not reached',
        resolved: claim.verdict,
        reopened: 'Review reopened',
        additional_review: 'Additional review',
      }
      steps.push({ label: labels[entry.kind], at: entry.timestamp })
    }
  } else {
    steps.push({ label: 'Claim submitted', at: claim.createdAt })
    steps.push({ label: 'Risk analyzed', at: claim.createdAt })
    steps.push({
      label: claim.matchedClaimId ? 'Fingerprint check' : 'Fingerprint check',
      at: claim.createdAt,
    })
    const hearing = courtroomService.latestFor(claim.id)
    if (hearing) steps.push({ label: 'Courtroom analysis', at: hearing.createdAt })
    for (const review of [...reviews].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )) {
      steps.push({
        label: review.perspective ? `Reviewer ${review.perspective}` : 'Reviewed',
        at: review.createdAt,
      })
    }
    if (claim.verdict !== 'Unverified') {
      steps.push({ label: claim.verdict, at: claim.resolvedAt ?? claim.updatedAt })
    }
  }
  const hearing = courtroomService.latestFor(claim.id)
  if (hearing && !steps.some((item) => item.label === 'Courtroom analysis')) {
    const afterRisk = steps.findIndex((item) => item.label.toLowerCase().includes('risk'))
    steps.splice(afterRisk >= 0 ? afterRisk + 1 : 2, 0, {
      label: 'Courtroom analysis',
      at: hearing.createdAt,
    })
  }
  steps.push({ label: 'Incident report prepared', at: new Date().toISOString() })
  return steps
}

function buildSnapshot(claim: Claim): IncidentSnapshot {
  const catalog = storageService.getStoredClaims()
  const reviews = storageService.getStoredReviews().filter((item) => item.claimId === claim.id)
  const path = verificationPath(claim, catalog, reviews)
  const consensus = socialService.getConsensus(claim.id)
  const metrics = socialService.metricsFor(claim.id)
  const session = courtroomService.latestFor(claim.id)
  return {
    claimId: claim.id,
    text: claim.text,
    sourceUrl: claim.sourceUrl,
    platform: claim.platform,
    category: claim.category,
    submittedAt: claim.createdAt,
    riskScore: claim.riskScore,
    riskLevel: claim.riskLevel,
    flags: [...claim.flags],
    verdict: claim.verdict,
    resolutionPath: path.resolutionPath,
    resolutionLabel: path.label,
    requiredPerspectives: path.required,
    completedPerspectives: path.completed,
    reviewerNotes: reviews
      .filter((item) => item.reviewerRole !== 'SYSTEM')
      .map((item) => ({
        reviewerId: item.reviewerId,
        perspective: item.perspective ?? null,
        verdict: item.verdict,
        note: item.note,
        createdAt: item.createdAt,
      })),
    evidence: evidenceItems(claim),
    courtroom: session
      ? {
          leaning: session.judge.leaning,
          hearingNumber: session.hearingNumber,
          prosecutorPoints: session.prosecutor.argument.length,
          defenderPoints: session.defender.argument.length,
          gaps: session.judge.evidenceGaps.length,
        }
      : null,
    community: {
      votes: consensus.total,
      agree: consensus.agree,
      disagree: consensus.disagree,
      unsure: consensus.unsure,
      comments: metrics.comments,
      shares: metrics.shares,
      saves: metrics.saves,
    },
    timeline: timelineFor(claim, reviews),
  }
}

export const reportingService = {
  list(): IncidentReport[] {
    return reportingStorage
      .getIncidents()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  getById(id: string): IncidentReport | null {
    return (
      reportingStorage.getIncidents().find((item) => item.id === id || item.incidentId === id) ??
      null
    )
  },

  latestForClaim(claimId: string): IncidentReport | null {
    return this.list().find((item) => item.claimId === claimId) ?? null
  },

  canPrepare(): boolean {
    const desk = sessionService.getDeskReviewer()
    return desk.accountType === 'reviewer' || Boolean(desk.perspective)
  },

  createDraft(claimId: string, notes = ''): IncidentReport {
    if (!this.canPrepare()) {
      throw new Error('Only a demo desk reviewer can prepare an incident report.')
    }
    const claim = storageService.getStoredClaims().find((item) => item.id === claimId)
    if (!claim) throw new Error('Claim was not found.')
    if (claim.verdict !== 'Verified False') {
      throw new Error('Official incident reports are only prepared for Verified False claims.')
    }
    const existing = reportingStorage
      .getIncidents()
      .find((item) => item.claimId === claimId && item.status === 'DRAFT')
    if (existing) return existing

    const actor = sessionService.getDeskReviewer()
    const now = new Date().toISOString()
    const all = reportingStorage.getIncidents()
    const report: IncidentReport = {
      id: createId('inc'),
      incidentId: nextIncidentId(all),
      claimId,
      createdAt: now,
      createdBy: actor.id,
      status: 'DRAFT',
      snapshot: buildSnapshot(claim),
      notes: notes.trim(),
      authorizedAt: null,
      authorizedBy: null,
      generatedAt: null,
      needsRevalidation: false,
      audit: [audit('created', actor.id, 'Incident report draft created from the verification record.')],
    }
    reportingStorage.saveIncidents([report, ...all])
    emitSocialChanged()
    return report
  },

  generateAuthorized(id: string, confirmed: boolean): IncidentReport {
    if (!confirmed) throw new Error('Authorization confirmation is required.')
    if (!this.canPrepare()) {
      throw new Error('Only a demo desk reviewer can authorize this report.')
    }
    const actor = sessionService.getDeskReviewer()
    const items = reportingStorage.getIncidents()
    const current = items.find((item) => item.id === id)
    if (!current) throw new Error('Incident report was not found.')
    if (current.status === 'READY FOR SUBMISSION') return current
    const now = new Date().toISOString()
    const next: IncidentReport = {
      ...current,
      status: 'READY FOR SUBMISSION',
      authorizedAt: now,
      authorizedBy: actor.id,
      generatedAt: now,
      audit: [
        audit('generated', actor.id, 'Submission-ready report generated. No external channel was contacted.'),
        audit('authorized', actor.id, 'Authorized reviewer confirmed the snapshot matches the verification record.'),
        ...current.audit,
      ],
    }
    reportingStorage.saveIncidents(items.map((item) => (item.id === id ? next : item)))
    emitSocialChanged()
    return next
  },

  flagRevalidation(claimId: string): void {
    const items = reportingStorage.getIncidents()
    let changed = false
    const next = items.map((item) => {
      if (item.claimId !== claimId || item.needsRevalidation) return item
      changed = true
      return {
        ...item,
        needsRevalidation: true,
        audit: [
          audit(
            'revalidation-flagged',
            sessionService.getDeskReviewerId(),
            'Associated claim was reopened. This snapshot was not rewritten.',
          ),
          ...item.audit,
        ],
      }
    })
    if (changed) {
      reportingStorage.saveIncidents(next)
      emitSocialChanged()
    }
  },
}
