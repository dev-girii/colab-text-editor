const express = require('express')
const roomController = require('../controllers/roomController')

const roomRouter = express.Router()

roomRouter.get('/', roomController.listRooms)
roomRouter.post('/', roomController.createRoom)
roomRouter.post('/:roomId/join', roomController.joinRoom)
roomRouter.patch('/:roomId/title', roomController.updateTitle)
roomRouter.patch('/:roomId/document', roomController.updateDocument)
roomRouter.get('/:roomId', roomController.getRoomById)

module.exports = roomRouter
