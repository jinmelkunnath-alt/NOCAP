import path from 'node:path'
import { pathToFileURL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

function aiDevPlugin(): Plugin {
  return {
    name: 'truthlens-ai-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/ai/')) {
          try {
            const routerPath = pathToFileURL(path.resolve(process.cwd(), 'api/_lib/router.ts')).href
            const { routeAiRequest } = await import(routerPath)
            const handled = await routeAiRequest(req, res)
            if (handled) return
          } catch (err) {
            console.error('Error handling AI dev route:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Dev server failed to execute AI endpoint' }))
            return
          }
        }
        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key] && value) {
      process.env[key] = value
    }
  }

  return {
    plugins: [react(), tailwindcss(), aiDevPlugin()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      allowedHosts: true,
    },
  }
})
