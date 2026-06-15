import express from 'express'
import protect from '../middleware/auth.js'
import {textMessageController} from '../controllers/messageController.js'
import multer from 'multer'
const upload = multer({storage:multer.memoryStorage()})

const messageRouter = express.Router()

messageRouter.post('/text',protect,upload.single("file"),textMessageController);


export default messageRouter;



