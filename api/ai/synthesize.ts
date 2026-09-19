import type { IncomingMessage, ServerResponse } from 'node:http'
import { aiClient } from '../_lib/aiClient.ts'

async function parseBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) return (req as any).body
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        resolve({})
      }
    })
  })
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method Not Allowed' }))
    return
  }

  try {
    const body = await parseBody(req)
    const { claim, comments = [], pollResults = {}, votes = {}, existingEvidence = [], risk = {} } = body

    if (!claim || typeof claim !== 'string') {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'claim is required' }))
      return
    }

    const result = await aiClient.synthesizeCommunity({
      claim,
      comments,
      pollResults,
      votes,
      existingEvidence,
      risk,
    })
    res.statusCode = 200
    res.end(JSON.stringify(result))
  } catch (err: any) {
    console.error('Error in /api/ai/synthesize handler:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Failed to synthesize community discourse', message: err?.message }))
  }
}
