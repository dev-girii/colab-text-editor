const { Prisma } = require('@prisma/client')

function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error)
    return
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  ) {
    response.status(404).json({ error: 'Room not found' })
    return
  }
  const statusCode = error.statusCode || 500
  const message =
    statusCode === 500 && !error.statusCode
      ? 'Internal Server Error'
      : error.message
  response.status(statusCode).json({ error: message })
}

module.exports = errorHandler
