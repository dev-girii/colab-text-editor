const bcryptjs = require('bcryptjs')
const roomService = require('../services/roomService')

function sendValidationError(response, message) {
  response.status(400).json({ error: message })
}

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
    const { title, password, username } = request.body
    const trimmedTitle = title === undefined || title === null ? '' : String(title).trim()
    if (trimmedTitle === '') {
      sendValidationError(response, 'Title is required')
      return
    }
    if (trimmedTitle.length > 100) {
      sendValidationError(response, 'Title must be at most 100 characters')
      return
    }
    if (
      password !== undefined &&
      password !== null &&
      String(password).length > 0 &&
      String(password).length < 4
    ) {
      sendValidationError(response, 'Password must be at least 4 characters')
      return
    }
    const room = await roomService.createRoom({
      title: trimmedTitle,
      password,
      createdBy: username,
    })
    response.status(201).json(room)
  } catch (error) {
    next(error)
  }
}

async function joinRoom(request, response, next) {
  try {
    const { roomId } = request.params
    const { username, password } = request.body
    const trimmedUsername =
      username === undefined || username === null ? '' : String(username).trim()
    if (trimmedUsername === '') {
      sendValidationError(response, 'Username is required')
      return
    }
    if (trimmedUsername.length > 30) {
      sendValidationError(response, 'Username must be at most 30 characters')
      return
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
    const { title, username } = request.body
    const trimmedTitle = title === undefined || title === null ? '' : String(title).trim()
    if (trimmedTitle === '') {
      sendValidationError(response, 'Title is required')
      return
    }
    if (trimmedTitle.length > 100) {
      sendValidationError(response, 'Title must be at most 100 characters')
      return
    }
    const trimmedUsername =
      username === undefined || username === null ? '' : String(username).trim()
    const roomCreatorRecord = await roomService.findRoomCreatorById(roomId)
    if (!roomCreatorRecord) {
      const notFoundError = new Error('Room not found')
      notFoundError.statusCode = 404
      throw notFoundError
    }
    if (roomCreatorRecord.createdBy !== trimmedUsername) {
      response
        .status(403)
        .json({ error: 'Only the room creator can rename this document' })
      return
    }
    const updatedRoom = await roomService.updateRoomTitle(roomId, trimmedTitle)
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

async function saveRevision(request, response, next) {
  try {
    const { roomId } = request.params
    const { content, savedBy } = request.body
    const normalizedContent =
      content === undefined || content === null ? '' : String(content)
    const normalizedSavedBy =
      savedBy === undefined || savedBy === null ? '' : String(savedBy).trim()
    if (normalizedContent === '') {
      sendValidationError(response, 'Content is required')
      return
    }
    if (normalizedSavedBy === '') {
      sendValidationError(response, 'savedBy is required')
      return
    }
    const revision = await roomService.createRevision(
      roomId,
      normalizedContent,
      normalizedSavedBy
    )
    response.status(201).json(revision)
  } catch (error) {
    next(error)
  }
}

async function getRevisions(request, response, next) {
  try {
    const { roomId } = request.params
    const revisions = await roomService.findRevisionsByRoomId(roomId)
    response.json(revisions)
  } catch (error) {
    next(error)
  }
}

async function deleteRoom(request, response, next) {
  try {
    const { roomId } = request.params
    await roomService.deleteRoom(roomId)
    if (request.app && typeof request.app.locals.closeConnectionsForRoom === 'function') {
      request.app.locals.closeConnectionsForRoom(roomId)
    }
    response.status(204).end()
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
  saveRevision,
  getRevisions,
  deleteRoom,
}
