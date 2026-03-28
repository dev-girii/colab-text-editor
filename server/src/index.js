const express = require('express')
const http = require('http')
const cors = require('cors')
const WebSocket = require('ws')
const { setupWSConnection } = require('y-websocket/bin/utils')
const roomRoutes = require('./routes/roomRoutes')
const errorHandler = require('./middleware/errorHandler')
const roomService = require('./services/roomService')

const PORT = Number(process.env.PORT) || 3000
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

const application = express()

application.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`)
  next()
})

application.use(cors({
  origin: (incomingOrigin, callback) => {
    const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
    const normalizedIncoming = incomingOrigin ? incomingOrigin.replace(/\/$/, '') : ''
    const normalizedAllowed = allowedOrigin.replace(/\/$/, '')
    if (!incomingOrigin || normalizedIncoming === normalizedAllowed) {
      callback(null, true)
    } else {
      callback(new Error(`CORS blocked: ${incomingOrigin}`))
    }
  },
  credentials: true
}))
application.use(express.json())
application.use('/api/rooms', roomRoutes)
application.get('/health', (req, res) => res.status(200).json({ status: 'ok' }))
application.use(errorHandler)

const httpServer = http.createServer(application)

const webSocketServer = new WebSocket.Server({ noServer: true })

webSocketServer.on('connection', (connection, request) => {
  let documentName = ''
  try {
    documentName = decodeURIComponent(request.url.slice(1).split('?')[0])
  } catch {
    documentName = request.url.slice(1).split('?')[0]
  }

  if (documentName) {
    roomService.incrementActiveConnections(documentName)
    console.log(`[WS] Connected: ${documentName} | Active: ${roomService.getActiveConnectionCount(documentName)}`)

    connection.on('close', () => {
      roomService.decrementActiveConnections(documentName)
      console.log(`[WS] Disconnected: ${documentName} | Active: ${roomService.getActiveConnectionCount(documentName)}`)
    })
  }

  setupWSConnection(connection, request)
})

httpServer.on('upgrade', (request, socket, head) => {
  webSocketServer.handleUpgrade(request, socket, head, (connection) => {
    webSocketServer.emit('connection', connection, request)
  })
})

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Running on port ${PORT} (HTTP + WS)`)
})