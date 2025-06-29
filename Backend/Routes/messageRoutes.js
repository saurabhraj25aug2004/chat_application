import express from 'express'
import { protectRoute } from '../Middlewares/auth.js'
import { getMessages, getuserforSidebar, markMessage, sendMessage } from '../controllers/messageController.js'
const messageRouter = express.Router()
messageRouter.get('/users',protectRoute,getuserforSidebar)
messageRouter.get('/:id',protectRoute,getMessages);
messageRouter.put('/mark/:id',protectRoute,markMessage)
messageRouter.post('/send/:id',protectRoute,sendMessage)
export default messageRouter;