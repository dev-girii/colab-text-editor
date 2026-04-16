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
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

async function findRoomCreatorById(roomId) {
  return prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, createdBy: true },
  })
}

async function createRoom({ title, password, createdBy }) {
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
  const normalizedCreator =
    createdBy !== undefined && createdBy !== null && String(createdBy).trim() !== ''
      ? String(createdBy).trim()
      : 'anonymous'
  return prisma.room.create({
    data: {
      id: roomId,
      title: trimmedTitle,
      passwordHash,
      isProtected,
      createdBy: normalizedCreator,
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

async function deleteRoom(roomId) {
  await prisma.$transaction([
    prisma.revision.deleteMany({ where: { roomId } }),
    prisma.document.deleteMany({ where: { roomId } }),
    prisma.room.delete({ where: { id: roomId } }),
  ])
  activeConnectionCountByRoomId.delete(roomId)
}

async function createRevision(roomId, content, savedBy) {
  return prisma.revision.create({
    data: {
      roomId,
      content: String(content),
      savedBy: String(savedBy),
    },
  })
}

async function findRevisionsByRoomId(roomId) {
  return prisma.revision.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      roomId: true,
      content: true,
      savedBy: true,
      createdAt: true,
    },
  })
}

module.exports = {
  findAllRooms,
  findRoomById,
  findRoomCreatorById,
  createRoom,
  updateRoomTitle,
  updateDocumentContent,
  deleteRoom,
  createRevision,
  findRevisionsByRoomId,
  incrementActiveConnections,
  decrementActiveConnections,
  getActiveConnectionCount,
  getActiveConnections: getActiveConnectionCount,
}
