const express = require('express')
const cors = require('cors')
const WebSocket = require('ws')
const { setupWSConnection } = require('y-websocket/bin/utils')
const roomRoutes = require('./routes/roomRoutes')
const errorHandler = require('./middleware/errorHandler')
const roomService = require('./services/roomService')

const httpPort = Number(process.env.PORT) || 3000
const webSocketPort = Number(process.env.WS_PORT) || 1234
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

const application = express()

// Log all HTTP requests
application.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`)
  next()
})

application.use(cors({ origin: clientOrigin }))
application.use(express.json())
application.use('/api/rooms', roomRoutes)
application.use(errorHandler)

// Start HTTP server
application.listen(httpPort, () => {
  console.log(`[HTTP] Server running at http://localhost:${httpPort}`)
})

// Start WebSocket server
const webSocketServer = new WebSocket.Server({ port: webSocketPort }, () => {
  console.log(`[WS] WebSocket server running at ws://localhost:${webSocketPort}`)
})

webSocketServer.on('connection', (connection, request) => {
  let documentName = ''
  try {
    documentName = decodeURIComponent(request.url.slice(1).split('?')[0])
  } catch {
    documentName = request.url.slice(1).split('?')[0]
  }

  if (documentName) {
    roomService.incrementActiveConnections(documentName)
    console.log(`[WS] Client connected to document: ${documentName} | Active connections: ${roomService.getActiveConnectionCount(documentName) || 0}`)

    connection.on('close', () => {
      roomService.decrementActiveConnections(documentName)
      console.log(`[WS] Client disconnected from document: ${documentName} | Active connections: ${roomService.getActiveConnectionCount(documentName) || 0}`)
    })
  }

  setupWSConnection(connection, request)
})