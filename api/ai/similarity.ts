import type { IncomingMessage, ServerResponse } from 'node:http'
import { aiClient } from '../_lib/aiClient.js'

async function parseBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) return (req as any).body
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk: Buffer | string) => {
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
    const { text, compareWith = [] } = body

    if (!text || typeof text !== 'string') {
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'text is required' }))
      return
    }

    const results = await aiClient.calculateSimilarity(text, Array.isArray(compareWith) ? compareWith : [])
    res.statusCode = 200
    res.end(JSON.stringify({ similarities: results }))
  } catch (err: any) {
    console.error('Error in /api/ai/similarity handler:', err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Failed to calculate similarity', message: err?.message }))
  }
}
