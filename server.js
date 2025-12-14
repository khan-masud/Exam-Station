const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const path = require('path')
const fs = require('fs')

// Load environment variables from .env file
require('dotenv').config()

// Ensure we're in the correct directory
if (process.cwd() !== __dirname) {
  console.log('[Server] Changing directory from', process.cwd(), 'to', __dirname)
  process.chdir(__dirname)
}

console.log('[Server] Working directory:', process.cwd())
console.log('[Server] .env file exists:', fs.existsSync('.env'))
console.log('[Server] .installed file exists:', fs.existsSync('.installed'))
console.log('[Server] .next folder exists:', fs.existsSync('.next'))
console.log('[Server] .built marker exists:', fs.existsSync('.built'))
console.log('[Server] public folder exists:', fs.existsSync('public'))

// If .next folder doesn't exist but .installed does, we need to rebuild
if (!fs.existsSync('.next') && fs.existsSync('.installed')) {
  console.warn('[Server] ⚠️  .next folder missing but app is installed. This may indicate incomplete upload.')
  console.warn('[Server] Please ensure the complete .next folder is included in your upload.')
}

// Disable face detection for production to save memory
process.env.DISABLE_FACE_DETECTION = 'true'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  console.log('Starting server with face detection disabled')
  console.log(`Memory available: ${Math.round(require('os').totalmem() / 1024 / 1024)}MB`)
  
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      // Serve static files from public folder
      if (parsedUrl.pathname.startsWith('/') && !parsedUrl.pathname.startsWith('/api') && !parsedUrl.pathname.startsWith('/_next')) {
        const filePath = path.join(__dirname, 'public', parsedUrl.pathname)
        
        // Only serve files that exist in public folder
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          console.log('[Static] Serving:', parsedUrl.pathname)
          return res.end(fs.readFileSync(filePath))
        }
      }
      
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
