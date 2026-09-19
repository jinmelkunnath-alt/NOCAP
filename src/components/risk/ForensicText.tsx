import type { RiskAnalysis } from '../../types'
import { cn } from '../../utils/cn'

interface ForensicTextProps {
  text: string
  analysis: RiskAnalysis
  className?: string
}

type Mark = 'sensational' | 'shouting' | 'plain'

interface Segment {
  text: string
  mark: Mark
}

function shoutingRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = []
  const regex = /[A-Za-z]+/g
  let match = regex.exec(text)
  while (match) {
    const token = match[0]
    if (token.length >= 2 && token === token.toUpperCase()) {
      ranges.push({ start: match.index, end: match.index + token.length })
    }
    match = regex.exec(text)
  }
  return ranges
}

function buildSegments(text: string, analysis: RiskAnalysis): Segment[] {
  if (!text) return []

  const coverage: Mark[] = Array.from({ length: text.length }, () => 'plain')

  for (const span of analysis.sensational.spans) {
    const start = Math.max(0, Math.min(span.start, text.length))
    const end = Math.max(start, Math.min(span.end, text.length))
    for (let i = start; i < end; i += 1) coverage[i] = 'sensational'
  }

  if (analysis.shouting.detected) {
    for (const range of shoutingRanges(text)) {
      for (let i = range.start; i < range.end; i += 1) {
        if (coverage[i] === 'plain') coverage[i] = 'shouting'
      }
    }
  }

  const segments: Segment[] = []
  let cursor = 0
  while (cursor < text.length) {
    const mark = coverage[cursor] ?? 'plain'
    let end = cursor + 1
    while (end < text.length && coverage[end] === mark) end += 1
    segments.push({ text: text.slice(cursor, end), mark })
    cursor = end
  }
  return segments
}

const markClass: Record<Mark, string> = {
  plain: '',
  sensational: 'forensic-sensational',
  shouting: 'forensic-shouting',
}

export function ForensicText({ text, analysis, className }: ForensicTextProps) {
  const segments = buildSegments(text, analysis)

  return (
    <p className={cn('text-base leading-relaxed text-ink', className)}>
      {segments.map((segment, index) =>
        segment.mark === 'plain' ? (
          <span key={index}>{segment.text}</span>
        ) : (
          <mark key={index} className={markClass[segment.mark]}>
            {segment.text}
          </mark>
        ),
      )}
    </p>
  )
}
