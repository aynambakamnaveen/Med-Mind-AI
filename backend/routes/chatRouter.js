import express from 'express'
import {createChat, getChats, deleteChat} from '../controllers/chatController.js'
import protect from '../middleware/auth.js'

const chatRouter = express.Router()

chatRouter.post('/create', protect, createChat)
chatRouter.get('/getchats', protect, getChats)
chatRouter.post('/delete', protect, deleteChat)


export default chatRouter;