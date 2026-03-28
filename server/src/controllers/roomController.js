const bcryptjs = require('bcryptjs')
const roomService = require('../services/roomService')

async function listRooms(request, response, next) {
  try {
    const rooms = await roomService.findAllRooms()
    const payload = rooms.map((room) => ({
      id: room.id,
      title: room.title,
      isProtected: room.isProtected,
      activeUsers: roomService.getActiveConnectionCount(room.id),
      createdAt: room.createdAt,
    }))
    response.json(payload)
  } catch (error) {
    next(error)
  }
}

async function createRoom(request, response, next) {
  try {
    const { title, password } = request.body
    if (title === undefined || title === null || String(title).trim() === '') {
      const validationError = new Error('Title is required')
      validationError.statusCode = 400
      throw validationError
    }
    const room = await roomService.createRoom({ title, password })
    response.status(201).json(room)
  } catch (error) {
    next(error)
  }
}

async function joinRoom(request, response, next) {
  try {
    const { roomId } = request.params
    const { username, password } = request.body
    if (
      username === undefined ||
      username === null ||
      String(username).trim() === ''
    ) {
      const validationError = new Error('Username is required')
      validationError.statusCode = 400
      throw validationError
    }
    const roomRecord = await roomService.findRoomById(roomId, {
      includeSecretFields: true,
    })
    if (!roomRecord) {
      const notFoundError = new Error('Room not found')
      notFoundError.statusCode = 404
      throw notFoundError
    }
    if (roomRecord.isProtected) {
      const passwordMatches = await bcryptjs.compare(
        String(password || ''),
        roomRecord.passwordHash || ''
      )
      if (!passwordMatches) {
        const unauthorizedError = new Error('Incorrect password')
        unauthorizedError.statusCode = 401
        throw unauthorizedError
      }
    }
    response.json({
      id: roomRecord.id,
      title: roomRecord.title,
      isProtected: roomRecord.isProtected,
      createdAt: roomRecord.createdAt,
    })
  } catch (error) {
    next(error)
  }
}

async function getRoomById(request, response, next) {
  try {
    const { roomId } = request.params
    const room = await roomService.findRoomById(roomId)
    if (!room) {
      const notFoundError = new Error('Room not found')
      notFoundError.statusCode = 404
      throw notFoundError
    }
    response.json(room)
  } catch (error) {
    next(error)
  }
}

async function updateTitle(request, response, next) {
  try {
    const { roomId } = request.params
    const { title } = request.body
    if (title === undefined || title === null || String(title).trim() === '') {
      const validationError = new Error('Title is required')
      validationError.statusCode = 400
      throw validationError
    }
    const updatedRoom = await roomService.updateRoomTitle(roomId, title)
    response.json(updatedRoom)
  } catch (error) {
    next(error)
  }
}

async function updateDocument(request, response, next) {
  try {
    const { roomId } = request.params
    const { content } = request.body
    if (content === undefined || content === null) {
      const validationError = new Error('Content is required')
      validationError.statusCode = 400
      throw validationError
    }
    await roomService.updateDocumentContent(roomId, String(content))
    response.json({ saved: true })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listRooms,
  createRoom,
  joinRoom,
  getRoomById,
  updateTitle,
  updateDocument,
}
