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

export type AiCheckErrorType = 'NOT_CONFIGURED' | 'AUTH_ERROR' | 'PARSE_ERROR' | 'UNAVAILABLE' | 'CLIENT_ERROR'

function normalizeErrorMessage(err: any): { userMessage: string; status: number; errorType: AiCheckErrorType } {
  if (err?.name === 'AiParseError') {
    return {
      userMessage: 'The AI model response could not be parsed as valid verification data.',
      status: 422,
      errorType: 'PARSE_ERROR',
    }
  }

  const msg = (err?.message || String(err)).toLowerCase()

  if (msg.includes('not configured') || msg.includes('missing') || msg.includes('api key')) {
    return {
      userMessage: 'NO CAP AI is not configured. OPENROUTER_API_KEY environment variable is missing.',
      status: 503,
      errorType: 'NOT_CONFIGURED',
    }
  }
  if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('authentication')) {
    return {
      userMessage: 'NO CAP AI authentication failed. Please verify the OpenRouter API key.',
      status: 401,
      errorType: 'AUTH_ERROR',
    }
  }
  if (msg.includes('parse') || msg.includes('json') || msg.includes('structured verification')) {
    return {
      userMessage: 'The AI model response could not be parsed as valid verification data.',
      status: 422,
      errorType: 'PARSE_ERROR',
    }
  }
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('busy') || msg.includes('quota')) {
    return {
      userMessage: 'NO CAP AI is temporarily busy. Please try again in a moment.',
      status: 429,
      errorType: 'UNAVAILABLE',
    }
  }
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('took too long')) {
    return {
      userMessage: 'NO CAP AI took too long to respond.',
      status: 504,
      errorType: 'UNAVAILABLE',
    }
  }

  return {
    userMessage: 'NO CAP AI is currently unavailable.',
    status: 503,
    errorType: 'UNAVAILABLE',
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method Not Allowed', errorType: 'CLIENT_ERROR' }))
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
      res.end(JSON.stringify({ error: 'Claim text is required', errorType: 'CLIENT_ERROR' }))
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
        const { userMessage, errorType } = normalizeErrorMessage(checkErr)
        sendEvent('error', { message: userMessage, errorType })
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
    const { userMessage, status, errorType } = normalizeErrorMessage(err)
    if (!res.headersSent) {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: userMessage, errorType }))
    }
  }
}
