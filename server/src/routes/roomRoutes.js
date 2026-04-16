const express = require('express')
const roomController = require('../controllers/roomController')

const roomRouter = express.Router()

roomRouter.get('/', roomController.listRooms)
roomRouter.post('/', roomController.createRoom)
roomRouter.post('/:roomId/join', roomController.joinRoom)
roomRouter.patch('/:roomId/title', roomController.updateTitle)
roomRouter.patch('/:roomId/document', roomController.updateDocument)
roomRouter.post('/:roomId/revisions', roomController.saveRevision)
roomRouter.get('/:roomId/revisions', roomController.getRevisions)
roomRouter.delete('/:roomId', roomController.deleteRoom)
roomRouter.get('/:roomId', roomController.getRoomById)

module.exports = roomRouter
