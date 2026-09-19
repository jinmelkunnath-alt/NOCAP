export const PLATFORMS = ['WhatsApp', 'X', 'Instagram', 'Reddit', 'Other'] as const
export type Platform = (typeof PLATFORMS)[number]

export const CATEGORIES = [
  'Politics',
  'Health',
  'Finance',
  'Technology',
  'Campus',
  'Entertainment',
  'Other',
] as const
export type Category = (typeof CATEGORIES)[number]

export const RISK_LEVELS = ['Low', 'Medium', 'High'] as const
export type RiskLevel = (typeof RISK_LEVELS)[number]

export const VERDICTS = [
  'Unverified',
  'Verified True',
  'Verified False',
  'Misleading',
] as const
export type Verdict = (typeof VERDICTS)[number]

export const RISK_FLAGS = ['Sensational', 'Shouting', 'Unsourced'] as const
export type RiskFlag = (typeof RISK_FLAGS)[number]

export type ReviewVerdict = Exclude<Verdict, 'Unverified'>

export const SORT_OPTIONS = [
  'riskWeighted',
  'newest',
  'oldest',
  'highestRisk',
  'lowestRisk',
] as const
export type SortOption = (typeof SORT_OPTIONS)[number]

export const UPLOAD_TYPES = ['user', 'ai'] as const
export type UploadType = (typeof UPLOAD_TYPES)[number]

export const ORIGIN_TYPES = ['USER', 'AI'] as const
export type OriginType = (typeof ORIGIN_TYPES)[number]

export const AI_LABELS = ['REAL', 'FAKE', 'INCONCLUSIVE'] as const
export type AiLabel = (typeof AI_LABELS)[number]

export const AI_VERIFICATION_STATES = ['VERIFIED', 'UNDER VERIFICATION'] as const
export type AiVerificationState = (typeof AI_VERIFICATION_STATES)[number]

export const COMMUNITY_ANALYSIS_STATES = ['none', 'ready'] as const
export type CommunityAnalysisState = (typeof COMMUNITY_ANALYSIS_STATES)[number]

export const VOTE_TYPES = ['agree', 'disagree', 'unsure'] as const
export type VoteType = (typeof VOTE_TYPES)[number]

export const COMMENT_TYPES = ['GENERAL', 'QUESTION', 'EVIDENCE', 'CORRECTION', 'COUNTERPOINT'] as const
export type CommentKind = (typeof COMMENT_TYPES)[number]

export const COURTROOM_LEANINGS = [
  'LEANING TRUE',
  'LEANING FALSE',
  'POTENTIALLY MISLEADING',
  'INSUFFICIENT EVIDENCE',
] as const
export type CourtroomLeaning = (typeof COURTROOM_LEANINGS)[number]

export const COURT_EVIDENCE_TYPES = [
  'SOURCE',
  'CLAIM_VARIANT',
  'REVIEW_HISTORY',
  'COMMUNITY_CONTEXT',
  'REVIEWER_NOTE',
  'CANDIDATE_SOURCE',
  'USER_CONTRIBUTION',
] as const
export type CourtEvidenceType = (typeof COURT_EVIDENCE_TYPES)[number]

export const COURT_EVIDENCE_STATUSES = [
  'reviewer-supplied',
  'needs-human-review',
  'context',
  'system',
] as const
export type CourtEvidenceStatus = (typeof COURT_EVIDENCE_STATUSES)[number]

export const POLL_OPTIONS = [
  'Likely True',
  'Likely False',
  'Misleading',
  'Not Enough Information',
] as const
export type PollOption = (typeof POLL_OPTIONS)[number]

export const ACCOUNT_TYPES = ['member', 'reviewer', 'demo'] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

export const PERSPECTIVES = ['A', 'B'] as const
export type Perspective = (typeof PERSPECTIVES)[number]

export const RESOLUTION_PATHS = [
  'FINGERPRINT_REUSE',
  'FAST_SINGLE_REVIEW',
  'BRIDGING_VERIFICATION',
] as const
export type ResolutionPath = (typeof RESOLUTION_PATHS)[number]

export const CONSENSUS_STATES = [
  'none',
  'awaiting',
  'reached',
  'conflict',
  'reused',
  'single',
] as const
export type ConsensusState = (typeof CONSENSUS_STATES)[number]

export const LEDGER_KINDS = [
  'submitted',
  'risk_analysis',
  'fingerprint_check',
  'routed',
  'fingerprint_reuse',
  'reviewer_decision',
  'consensus_reached',
  'consensus_not_reached',
  'resolved',
  'reopened',
  'additional_review',
] as const
export type LedgerKind = (typeof LEDGER_KINDS)[number]

export const ENGAGEMENT_TYPES = ['vote', 'comment', 'share', 'save', 'submit'] as const
export type EngagementType = (typeof ENGAGEMENT_TYPES)[number]

export const FEED_TABS = ['for-you', 'trending', 'latest', 'user', 'ai'] as const
export type FeedTab = (typeof FEED_TABS)[number]

export interface Evidence {
  id: string
  url: string
  title?: string
  description?: string
}

export interface TextSpan {
  start: number
  end: number
  text: string
}

export interface RiskAnalysis {
  flags: RiskFlag[]
  riskLevel: RiskLevel
  riskScore: number
  sensational: {
    detected: boolean
    matches: string[]
    spans: TextSpan[]
  }
  shouting: {
    detected: boolean
    uppercasePercentage: number
  }
  unsourced: {
    detected: boolean
  }
  explanation: string[]
}

export type RiskAnalysisResult = RiskAnalysis

export interface Claim {
  id: string
  text: string
  sourceUrl: string
  platform: Platform
  category: Category
  flags: RiskFlag[]
  riskLevel: RiskLevel
  riskScore: number
  verdict: Verdict
  reviewerNote: string
  reviewerId: string
  evidence: Evidence[]
  createdAt: string
  updatedAt: string
  locked: boolean
  confidence: number | null
  analysis?: RiskAnalysis
  fingerprint?: string
  matchedClaimId?: string | null
  similarityScore?: number | null
  potentialDuplicate?: boolean
  similarSubmissionCount?: number
  authorId?: string
  uploadType?: UploadType
  originType?: OriginType
  originalText?: string
  enhancedByAI?: boolean
  clusterId?: string
  independentCheckCount?: number
  communityAnalysisStatus?: CommunityAnalysisState
  resolutionPath?: ResolutionPath | null
  consensusState?: ConsensusState | null
  resolvedAt?: string | null
  candidateSources?: Evidence[]
}

export interface Review {
  id: string
  claimId: string
  reviewerId: string
  verdict: Verdict
  note: string
  confidence?: number
  evidence: Evidence[]
  createdAt: string
  reviewerRole?: 'SYSTEM' | 'REVIEWER'
  perspective?: Perspective | null
}

export interface LedgerEntry {
  id: string
  claimId: string
  timestamp: string
  kind: LedgerKind
  verdict: Verdict | null
  actorId: string
  actorRole: 'SYSTEM' | 'REVIEWER'
  perspective?: Perspective | null
  note: string
  resolutionPath?: ResolutionPath | null
}

export interface DeskNotification {
  id: string
  userId: string
  claimId?: string
  title: string
  body: string
  createdAt: string
  read: boolean
}

export interface UserProfile {
  id: string
  username: string
  displayName: string
  bio: string
  joinedAt: string
  accountType: AccountType
  perspective?: Perspective | null
}

export interface Vote {
  id: string
  claimId: string
  userId: string
  type: VoteType
  createdAt: string
}

export interface CommentRecord {
  id: string
  claimId: string
  authorId: string
  parentId: string | null
  type: CommentKind
  text: string
  createdAt: string
  helpfulBy: string[]
  reportedBy: string[]
}

export interface Follow {
  id: string
  followerId: string
  followingId: string
  createdAt: string
}

export interface Bookmark {
  id: string
  userId: string
  claimId: string
  createdAt: string
}

export interface ShareRecord {
  id: string
  userId: string
  claimId: string
  createdAt: string
}

export interface EngagementEvent {
  id: string
  claimId: string
  userId: string
  type: EngagementType
  createdAt: string
}

export interface HonorBreakdown {
  verificationContributions: number
  evidenceContributions: number
  helpfulReports: number
  constructiveParticipation: number
  total: number
}

export interface AchievementDef {
  id: string
  name: string
  description: string
}

export interface EarnedAchievement extends AchievementDef {
  earnedAt: string | null
}

export interface VerificationSummary {
  claimId: string
  verdict: Verdict
  resolutionPath: ResolutionPath
  latency: 'INSTANT' | 'FAST' | 'REVIEW REQUIRED'
  required: number
  completed: number
  communityVotes: number
  communityAgree: number
  communityDisagree: number
  communityUnsure: number
  courtroomLeaning: CourtroomLeaning | null
  courtroomHearing: number | null
  riskLevel: RiskLevel
  riskScore: number
  flags: RiskFlag[]
  evidenceCount: number
  reviewCount: number
  hasCourtroom: boolean
}

export interface EvidencePreviewItem {
  id: string
  label: string
  present: boolean
}

export interface HistoryStep {
  id: string
  label: string
  done: boolean
}

export interface CommunityConsensus {
  claimId: string
  agree: number
  disagree: number
  unsure: number
  total: number
  consensusPercent: number
  demo: boolean
}

export interface EngagementMetrics {
  votes: number
  comments: number
  shares: number
  saves: number
}

export interface RumourVelocity {
  windowMinutes: number
  interactions: number
  label: 'rapid' | 'active' | 'quiet' | 'unknown'
  note: string
}

export interface VerificationPath {
  kind: 'fingerprint-reuse' | 'single-reviewer' | 'bridging-consensus'
  required: number
  completed: number
  label: string
  detail: string
  resolutionPath: ResolutionPath
  latency: 'INSTANT' | 'FAST' | 'REVIEW REQUIRED'
  consensusState: ConsensusState
  perspectiveA?: Verdict | 'pending'
  perspectiveB?: Verdict | 'pending'
}

export interface CreateClaimInput {
  text: string
  sourceUrl: string
  platform: Platform
  category: Category
  originalText?: string
  enhancedByAI?: boolean
  originType?: OriginType
  authorId?: string
  uploadType?: UploadType
  clusterId?: string
  independentCheckCount?: number
}

export interface AiAssessment {
  label: AiLabel
  verification: AiVerificationState
  found: boolean
  aiConfidence: number
  why: string
  matchedClaimId: string | null
  similarityPercent: number | null
  evidenceNote: string
  summary?: string
  evidence?: string[]
  counterEvidence?: string[]
  uncertainties?: string[]
  sources?: Array<{
    title: string
    url: string
    domain: string
    snippet?: string
  }>
  recommendedAction?: string
  needsHumanReview?: boolean
  usedWebSearch?: boolean
  riskLevel?: string
  riskScore?: number
  riskFlags?: string[]
  reasoningText?: string
  thinking?: string
  reasoningSteps?: string[]
  meta?: {
    modelUsed?: string
    reasoningTokens?: number
    totalTokens?: number
    durationMs?: number
    reasoningText?: string
  }
}

export interface RumourCheck {
  id: string
  userId: string
  originalText: string
  fingerprint: string
  clusterId: string
  createdAt: string
  postedClaimId: string | null
  result: AiAssessment
}

export interface CommunityAiAnalysis {
  id: string
  claimId: string
  createdAt: string
  responseCount: number
  uniqueUsers: number
  label: AiLabel
  verification: AiVerificationState
  aiConfidence: number
  why: string
}

export interface CreateReviewInput {
  claimId: string
  reviewerId: string
  note: string
  verdict: Verdict
  confidence?: number
  evidence: Array<Pick<Evidence, 'url' | 'title' | 'description'>>
}

export interface ClaimFormErrors {
  text?: string
  platform?: string
  category?: string
  sourceUrl?: string
}

export interface ClaimFilters {
  search: string
  category: Category | 'All'
  verdict: Verdict | 'All'
  risk: RiskLevel | 'All'
  platform: Platform | 'All'
  sort: SortOption
}

export interface ClaimStats {
  total: number
  unverified: number
  highRisk: number
  reviewed: number
  flagged: number
  potentialDuplicates: number
  relatedSubmissions: number
  communityVotes: number
  byRisk: Record<RiskLevel, number>
  byVerdict: Record<Verdict, number>
  byPlatform: Record<Platform, number>
  byCategory: Record<Category, number>
}

export interface ClaimMatch {
  claimId: string
  similarity: number
  label: 'potential' | 'strong'
}

export interface CourtArgument {
  role: 'prosecutor' | 'defender'
  argument: string[]
  evidence: string[]
  reasoning: string[]
  limitations: string[]
}

export interface JudgeRuling {
  leaning: CourtroomLeaning
  rationale: string
  supporting: string[]
  counterpoints: string[]
  evidenceGaps: string[]
  assessmentConfidence: number
}

export interface CourtEvidence {
  id: string
  claimId: string
  type: CourtEvidenceType
  title: string
  reference: string
  explanation: string
  status: CourtEvidenceStatus
  url?: string
  authorId?: string
  createdAt: string
}

export interface CourtroomSession {
  id: string
  claimId: string
  hearingNumber: number
  createdAt: string
  prosecutor: CourtArgument
  defender: CourtArgument
  judge: JudgeRuling
  evidenceIds: string[]
  communitySnapshot: {
    agree: number
    disagree: number
    unsure: number
    total: number
  }
  demo: boolean
}

export interface ClaimPoll {
  id: string
  claimId: string
  question: string
  options: string[]
  createdAt: string
  authorId: string
}

export interface PollVote {
  id: string
  pollId: string
  userId: string
  optionIndex: number
  createdAt: string
}

export type ClaimUpdates = Partial<Omit<Claim, 'id' | 'createdAt'>>

export const INCIDENT_STATUSES = ['DRAFT', 'AUTHORIZED', 'READY FOR SUBMISSION'] as const
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number]

export const COMMUNITY_REPORT_REASONS = [
  'Spam',
  'Harassment',
  'Manipulated Content',
  'Off-topic',
  'Potentially harmful misinformation',
  'Missing context',
  'Other',
] as const
export type CommunityReportReason = (typeof COMMUNITY_REPORT_REASONS)[number]

export const MODERATION_STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const
export type ModerationStatus = (typeof MODERATION_STATUSES)[number]

export interface IncidentEvidenceItem {
  title: string
  type: string
  reference: string
  description: string
  addedBy: string
  createdAt: string
  classification: 'reviewer-provided' | 'user-contributed' | 'candidate-source' | 'courtroom-context'
}

export interface IncidentTimelineStep {
  label: string
  at: string | null
}

export interface IncidentSnapshot {
  claimId: string
  text: string
  sourceUrl: string
  platform: string
  category: string
  submittedAt: string
  riskScore: number
  riskLevel: string
  flags: string[]
  verdict: Verdict
  resolutionPath: ResolutionPath
  resolutionLabel: string
  requiredPerspectives: number
  completedPerspectives: number
  reviewerNotes: Array<{
    reviewerId: string
    perspective: Perspective | null
    verdict: Verdict
    note: string
    createdAt: string
  }>
  evidence: IncidentEvidenceItem[]
  courtroom: {
    leaning: string
    hearingNumber: number
    prosecutorPoints: number
    defenderPoints: number
    gaps: number
  } | null
  community: {
    votes: number
    agree: number
    disagree: number
    unsure: number
    comments: number
    shares: number
    saves: number
  }
  timeline: IncidentTimelineStep[]
}

export interface IncidentAuditEvent {
  id: string
  at: string
  kind: 'created' | 'reviewed' | 'authorized' | 'generated' | 'revalidation-flagged'
  actorId: string
  note: string
}

export interface IncidentReport {
  id: string
  incidentId: string
  claimId: string
  createdAt: string
  createdBy: string
  status: IncidentStatus
  snapshot: IncidentSnapshot
  notes: string
  authorizedAt: string | null
  authorizedBy: string | null
  generatedAt: string | null
  needsRevalidation: boolean
  audit: IncidentAuditEvent[]
}

export interface CommunityReport {
  id: string
  claimId: string
  commentId: string | null
  reporterId: string
  reason: CommunityReportReason
  detail: string
  createdAt: string
  status: ModerationStatus
  target: 'claim' | 'comment'
}

export interface ModerationAction {
  id: string
  reportId: string
  actorId: string
  action: 'reviewing' | 'dismiss' | 'send-to-review' | 'resolve'
  note: string
  createdAt: string
}
