import { RISK_WEIGHTS, SENSATIONAL_TRIGGERS } from '../config/intelligence'
import type { RiskAnalysis, RiskFlag, RiskLevel, TextSpan } from '../types'

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function phrasePattern(phrase: string): string {
  return phrase
    .trim()
    .split(/\s+/)
    .map((part) => escapeRegex(part).replace(/'/g, "['’]"))
    .join('\\s+')
}

export function detectSensational(text: string): { detected: boolean; matches: string[]; spans: TextSpan[] } {
  const spans: TextSpan[] = []

  for (const trigger of SENSATIONAL_TRIGGERS) {
    const regex = new RegExp(phrasePattern(trigger), 'gi')
    let match = regex.exec(text)
    while (match) {
      const matchedText = match[0]
      if (matchedText) {
        spans.push({
          start: match.index,
          end: match.index + matchedText.length,
          text: matchedText,
        })
      }
      if (regex.lastIndex === match.index) regex.lastIndex += 1
      match = regex.exec(text)
    }
  }

  spans.sort((a, b) => a.start - b.start || b.end - a.end)
  const merged: TextSpan[] = []
  for (const span of spans) {
    const last = merged[merged.length - 1]
    if (!last || span.start > last.end) {
      merged.push({ ...span })
    } else if (span.end > last.end) {
      last.end = span.end
      last.text = text.slice(last.start, last.end)
    }
  }

  const matches = [...new Set(merged.map((span) => span.text))]
  return {
    detected: merged.length > 0,
    matches,
    spans: merged,
  }
}

export function calculateUppercasePercentage(text: string): number {
  const letters = text.replace(/[^A-Za-z]/g, '')
  if (letters.length === 0) return 0
  const uppercase = letters.replace(/[^A-Z]/g, '')
  return (uppercase.length / letters.length) * 100
}

export function detectShouting(text: string): { detected: boolean; uppercasePercentage: number } {
  const uppercasePercentage = calculateUppercasePercentage(text)
  return {
    detected: uppercasePercentage > 50,
    uppercasePercentage,
  }
}

export function detectUnsourced(sourceUrl: string): { detected: boolean } {
  const trimmed = sourceUrl.trim()
  if (!trimmed) return { detected: true }
  try {
    const parsed = new URL(trimmed)
    const valid = parsed.protocol === 'http:' || parsed.protocol === 'https:'
    return { detected: !valid }
  } catch {
    return { detected: true }
  }
}

export function calculateRiskLevel(flags: RiskFlag[]): RiskLevel {
  if (flags.length === 0) return 'Low'
  if (flags.length === 1) return 'Medium'
  return 'High'
}

export function calculateRiskScore(flags: RiskFlag[]): number {
  let score = 0
  if (flags.includes('Sensational')) score += RISK_WEIGHTS.Sensational
  if (flags.includes('Shouting')) score += RISK_WEIGHTS.Shouting
  if (flags.includes('Unsourced')) score += RISK_WEIGHTS.Unsourced
  return Math.min(100, Math.max(0, score))
}

export function buildRiskExplanation(analysis: Omit<RiskAnalysis, 'explanation'>): string[] {
  const lines: string[] = []
  const count = analysis.flags.length

  if (count === 0) {
    lines.push('No risk signals detected according to the NO CAP triage rules.')
  } else {
    lines.push(
      `${count} risk signal${count === 1 ? '' : 's'} detected according to the NO CAP triage rules.`,
    )
  }

  if (analysis.sensational.detected) {
    lines.push(
      `Sensational language matched: ${analysis.sensational.matches.map((item) => `"${item}"`).join(', ')}.`,
    )
  } else {
    lines.push('No sensational trigger phrases detected.')
  }

  const caps = Math.round(analysis.shouting.uppercasePercentage)
  if (analysis.shouting.detected) {
    lines.push(`Shouting: ${caps}% of alphabetic characters are uppercase.`)
  } else {
    lines.push(`Shouting not detected (${caps}% uppercase).`)
  }

  if (analysis.unsourced.detected) {
    lines.push('No valid http(s) source URL provided.')
  } else {
    lines.push('A valid source URL was provided.')
  }

  lines.push(
    `Classification: ${analysis.riskLevel} risk. Rule-based triage score ${analysis.riskScore} / 100 based on observable signals.`,
  )

  return lines
}

export function analyzeClaimText(text: string, sourceUrl: string): RiskAnalysis {
  const sensational = detectSensational(text)
  const shouting = detectShouting(text)
  const unsourced = detectUnsourced(sourceUrl)

  const flags: RiskFlag[] = []
  if (sensational.detected) flags.push('Sensational')
  if (shouting.detected) flags.push('Shouting')
  if (unsourced.detected) flags.push('Unsourced')

  const partial = {
    flags,
    riskLevel: calculateRiskLevel(flags),
    riskScore: calculateRiskScore(flags),
    sensational,
    shouting,
    unsourced,
  }

  return {
    ...partial,
    explanation: buildRiskExplanation(partial),
  }
}
