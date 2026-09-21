import type { IncomingMessage, ServerResponse } from 'node:http'
import checkHandler from '../ai/check.js'
import enhanceHandler from '../ai/enhance.js'
import synthesizeHandler from '../ai/synthesize.js'
import similarityHandler from '../ai/similarity.js'

export async function routeAiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url?.split('?')[0] || ''

  if (url === '/api/ai/check') {
    await checkHandler(req, res)
    return true
  }
  if (url === '/api/ai/enhance') {
    await enhanceHandler(req, res)
    return true
  }
  if (url === '/api/ai/synthesize') {
    await synthesizeHandler(req, res)
    return true
  }
  if (url === '/api/ai/similarity') {
    await similarityHandler(req, res)
    return true
  }

  return false
}
