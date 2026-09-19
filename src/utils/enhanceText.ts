import { QUESTION_WRAPPERS } from '../config/checker'

export function stripQuestionWrapper(text: string): string {
  let value = text.trim()
  for (const pattern of QUESTION_WRAPPERS) {
    value = value.replace(pattern, '')
  }
  return value.replace(/\s+/g, ' ').trim()
}

export function enhanceClaimText(original: string): string {
  let body = stripQuestionWrapper(original)
  body = body.replace(/\s+/g, ' ').trim()
  body = body.replace(/\?+$/g, '')
  body = body.replace(/\s+/g, ' ').trim()
  if (!body) return original.trim()

  body = body.replace(/\bare getting\b/gi, 'will receive')
  body = body.replace(/\bare being distributed\b/gi, 'will be distributed')
  body = body.replace(/\blets anyone\b/gi, 'lets anyone')

  const first = body.charAt(0).toUpperCase()
  const rest = body.slice(1)
  let sentence = `${first}${rest}`
  if (!/[.!?]$/.test(sentence)) sentence = `${sentence}.`
  if (!/^rumour:/i.test(sentence)) sentence = `Rumour: ${sentence}`
  return sentence
}
