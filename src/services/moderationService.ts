import type {
  CommunityReport,
  CommunityReportReason,
  ModerationAction,
  ModerationStatus,
} from '../types'
import { createId } from '../utils/format'
import { emitSocialChanged } from './dataEvents'
import { reportingStorage } from './reportingStorage'
import { sessionService } from './sessionService'

export const moderationService = {
  listReports(): CommunityReport[] {
    return reportingStorage
      .getCommunityReports()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  forClaim(claimId: string): CommunityReport[] {
    return this.listReports().filter((item) => item.claimId === claimId)
  },

  queue(): CommunityReport[] {
    return this.listReports().filter((item) => item.status === 'OPEN' || item.status === 'REVIEWING')
  },

  actionsFor(reportId: string): ModerationAction[] {
    return reportingStorage
      .getActions()
      .filter((item) => item.reportId === reportId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  },

  createReport(input: {
    claimId: string
    reason: CommunityReportReason
    detail?: string
    commentId?: string | null
  }): CommunityReport {
    const reporterId = sessionService.getCurrentUserId()
    const record: CommunityReport = {
      id: createId('mrep'),
      claimId: input.claimId,
      commentId: input.commentId ?? null,
      reporterId,
      reason: input.reason,
      detail: (input.detail ?? '').trim(),
      createdAt: new Date().toISOString(),
      status: 'OPEN',
      target: input.commentId ? 'comment' : 'claim',
    }
    reportingStorage.saveCommunityReports([record, ...reportingStorage.getCommunityReports()])
    emitSocialChanged()
    return record
  },

  canModerate(): boolean {
    const desk = sessionService.getDeskReviewer()
    return desk.accountType === 'reviewer' || Boolean(desk.perspective)
  },

  apply(reportId: string, action: ModerationAction['action'], note = ''): CommunityReport {
    if (!this.canModerate()) {
      throw new Error('Only a demo desk reviewer can take moderation actions.')
    }
    const reports = reportingStorage.getCommunityReports()
    const current = reports.find((item) => item.id === reportId)
    if (!current) throw new Error('Moderation report was not found.')
    const status: ModerationStatus =
      action === 'dismiss'
        ? 'DISMISSED'
        : action === 'resolve'
          ? 'RESOLVED'
          : action === 'send-to-review'
            ? 'REVIEWING'
            : 'REVIEWING'
    const updated: CommunityReport = { ...current, status }
    reportingStorage.saveCommunityReports(reports.map((item) => (item.id === reportId ? updated : item)))
    reportingStorage.saveActions([
      {
        id: createId('mact'),
        reportId,
        actorId: sessionService.getDeskReviewerId(),
        action,
        note: note.trim(),
        createdAt: new Date().toISOString(),
      },
      ...reportingStorage.getActions(),
    ])
    emitSocialChanged()
    return updated
  },
}
