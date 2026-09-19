import type { IncomingMessage, ServerResponse } from 'node:http'
import { runOpenRouterCheck, type CheckClaimPayload } from '../_lib/openrouter.ts'

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

function normalizeErrorMessage(err: any): { userMessage: string; status: number } {
  const msg = (err?.message || String(err)).toLowerCase()

  if (msg.includes('not configured') || msg.includes('missing') || msg.includes('api key')) {
    return { userMessage: 'NO CAP AI is not configured.', status: 503 }
  }
  if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('authentication')) {
    return { userMessage: 'NO CAP AI authentication failed.', status: 401 }
  }
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('busy') || msg.includes('quota')) {
    return { userMessage: 'NO CAP AI is temporarily busy.', status: 429 }
  }
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('took too long')) {
    return { userMessage: 'NO CAP AI took too long to respond.', status: 504 }
  }
  if (msg.includes('web search') || msg.includes('plugin')) {
    return { userMessage: 'Current web verification is unavailable.', status: 502 }
  }

  return { userMessage: 'NO CAP AI could not complete this check.', status: 500 }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method Not Allowed' }))
    return
  }

  const acceptHeader = req.headers['accept'] || ''
  const isSse = acceptHeader.includes('text/event-stream') || req.url?.includes('stream=true')

  try {
    const body = await parseBody(req)
    const { claim, sourceUrl, platform, category, riskAnalysis, matchedClaim } = body

    if (!claim || typeof claim !== 'string' || claim.trim().length === 0) {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Claim text is required' }))
      return
    }

    const payload: CheckClaimPayload = {
      claim: claim.trim(),
      sourceUrl: typeof sourceUrl === 'string' ? sourceUrl : null,
      platform: typeof platform === 'string' ? platform : null,
      category: typeof category === 'string' ? category : null,
      riskAnalysis: riskAnalysis && typeof riskAnalysis === 'object' ? riskAnalysis : null,
      matchedClaim: matchedClaim && typeof matchedClaim === 'object' ? matchedClaim : null,
    }

    if (isSse) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      })

      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      }

      try {
        const result = await runOpenRouterCheck(payload, (progress) => {
          sendEvent('progress', progress)
        })

        sendEvent('result', result)
        res.end()
      } catch (checkErr: any) {
        const { userMessage } = normalizeErrorMessage(checkErr)
        sendEvent('error', { message: userMessage })
        res.end()
      }
    } else {
      res.setHeader('Content-Type', 'application/json')
      const result = await runOpenRouterCheck(payload)
      res.statusCode = 200
      res.end(JSON.stringify(result))
    }
  } catch (err: any) {
    console.error('Error in /api/ai/check handler:', err)
    const { userMessage, status } = normalizeErrorMessage(err)
    if (!res.headersSent) {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: userMessage }))
    }
  }
}
