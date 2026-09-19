import { FINGERPRINT_STOPWORDS, SIMILARITY_THRESHOLDS } from '../config/intelligence'

const CANONICAL: Record<string, string> = {
  pm: 'government',
  pmo: 'government',
  govt: 'government',
  gov: 'government',
  government: 'government',
  administration: 'government',
  announces: 'offer',
  announce: 'offer',
  announced: 'offer',
  announcing: 'offer',
  distributing: 'offer',
  distribute: 'offer',
  distributed: 'offer',
  distribution: 'offer',
  giving: 'offer',
  give: 'offer',
  given: 'offer',
  provides: 'offer',
  providing: 'offer',
  provided: 'offer',
  provide: 'offer',
  students: 'student',
  student: 'student',
  pupils: 'student',
  pupil: 'student',
  laptops: 'laptop',
  laptop: 'laptop',
  computers: 'laptop',
  computer: 'laptop',
  getting: 'offer',
  gets: 'offer',
  receive: 'offer',
  receives: 'offer',
  received: 'offer',
  lpu: 'lpu',
}

function stem(token: string): string {
  if (token.length <= 4) return token
  if (token.endsWith('ies')) return `${token.slice(0, -3)}y`
  if (token.endsWith('ing') && token.length > 6) return token.slice(0, -3)
  if (token.endsWith('ed') && token.length > 5) return token.slice(0, -2)
  if (token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1)
  return token
}

export function normalizeClaim(text: string): string[] {
  const lowered = text.toLowerCase()
  const stripped = lowered.replace(/[^a-z0-9\s]/g, ' ')
  const collapsed = stripped.replace(/\s+/g, ' ').trim()
  if (!collapsed) return []

  const tokens = collapsed.split(' ')
  const result: string[] = []

  for (const raw of tokens) {
    if (raw.length < 2) continue
    if (FINGERPRINT_STOPWORDS.has(raw)) continue
    const folded = CANONICAL[raw] ?? stem(raw)
    const canonical = CANONICAL[folded] ?? folded
    if (canonical.length < 2) continue
    if (FINGERPRINT_STOPWORDS.has(canonical)) continue
    result.push(canonical)
  }

  return result
}

export function fingerprintClaim(text: string): string {
  return [...new Set(normalizeClaim(text))].sort().join(' ')
}

export function calculateClaimSimilarity(a: string, b: string): number {
  const tokensA = new Set(normalizeClaim(a))
  const tokensB = new Set(normalizeClaim(b))

  if (tokensA.size === 0 && tokensB.size === 0) return 1
  if (tokensA.size === 0 || tokensB.size === 0) return 0

  let intersection = 0
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1
  }

  const union = tokensA.size + tokensB.size - intersection
  if (union === 0) return 0
  return intersection / union
}

export function similarityPercent(score: number): number {
  return Math.round(score * 100)
}

export function similarityLabel(score: number): 'none' | 'potential' | 'strong' {
  if (score >= SIMILARITY_THRESHOLDS.strong) return 'strong'
  if (score >= SIMILARITY_THRESHOLDS.potential) return 'potential'
  return 'none'
}
