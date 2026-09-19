export const CHECKER_CONFIG = {
  aiRumourIndependentUsers: 3,
  communityAnalysisMinResponses: 12,
  minMeaningfulCommentLength: 12,
  foundSimilarity: 0.7,
} as const

export const CHECKER_EXAMPLES = [
  'Is it true that LPU students are getting free laptops tomorrow?',
  'Someone said RBI will double your bank balance if you forward a message.',
  'I saw a post claiming 5G towers spread viral infections.',
] as const

export const QUESTION_WRAPPERS = [
  /^is it true that\s+/i,
  /^is it true\s+/i,
  /^someone said(?: that)?\s+/i,
  /^i saw a post claiming(?: that)?\s+/i,
  /^i heard(?: that)?\s+/i,
  /^rumour:\s*/i,
  /^rumor:\s*/i,
  /^are they saying\s+/i,
  /^rumour detected across multiple independent user checks:\s*/i,
  /^rumor detected across multiple independent user checks:\s*/i,
] as const

