const { PrismaClient } = require('@prisma/client')
const bcryptjs = require('bcryptjs')
const { generateRoomId } = require('../utils/generateRoomId')

const prisma = new PrismaClient()

const activeConnectionCountByRoomId = new Map()

function incrementActiveConnections(roomId) {
  const previousCount = activeConnectionCountByRoomId.get(roomId) || 0
  activeConnectionCountByRoomId.set(roomId, previousCount + 1)
}

function decrementActiveConnections(roomId) {
  const previousCount = activeConnectionCountByRoomId.get(roomId) || 0
  const nextCount = previousCount - 1
  if (nextCount <= 0) {
    activeConnectionCountByRoomId.delete(roomId)
  } else {
    activeConnectionCountByRoomId.set(roomId, nextCount)
  }
}

function getActiveConnectionCount(roomId) {
  return activeConnectionCountByRoomId.get(roomId) || 0
}

async function findAllRooms() {
  return prisma.room.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      isProtected: true,
      createdAt: true,
    },
  })
}

async function findRoomById(roomId, options = {}) {
  const includeSecretFields = options.includeSecretFields === true
  if (includeSecretFields) {
    return prisma.room.findUnique({
      where: { id: roomId },
    })
  }
  return prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      title: true,
      isProtected: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

async function createRoom({ title, password }) {
  const roomId = generateRoomId()
  const trimmedTitle = String(title).trim()
  const passwordProvided =
    password !== undefined &&
    password !== null &&
    String(password).length > 0
  const saltRounds = Number(process.env.bcryptjs_SALT_ROUNDS) || 10
  const passwordHash = passwordProvided
    ? await bcryptjs.hash(String(password), saltRounds)
    : null
  const isProtected = passwordProvided
  return prisma.room.create({
    data: {
      id: roomId,
      title: trimmedTitle,
      passwordHash,
      isProtected,
      document: {
        create: {},
      },
    },
    select: {
      id: true,
      title: true,
      isProtected: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

async function updateRoomTitle(roomId, title) {
  const trimmedTitle = String(title).trim()
  return prisma.room.update({
    where: { id: roomId },
    data: { title: trimmedTitle },
    select: {
      id: true,
      title: true,
      isProtected: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

async function updateDocumentContent(roomId, content) {
  return prisma.document.update({
    where: { roomId },
    data: { content: String(content) },
  })
}

module.exports = {
  findAllRooms,
  findRoomById,
  createRoom,
  updateRoomTitle,
  updateDocumentContent,
  incrementActiveConnections,
  decrementActiveConnections,
  getActiveConnectionCount,
  getActiveConnections: getActiveConnectionCount,
}
