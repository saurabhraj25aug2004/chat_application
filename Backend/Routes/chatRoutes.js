import express from 'express';
import { createGroupChat, fetchChats } from '../controllers/chatController.js';
import { protectRoute } from '../Middlewares/auth.js';
import { deleteChat } from "../controllers/chatController.js";

const router = express.Router();

router.get('/', protectRoute, fetchChats);
router.post('/group', protectRoute, createGroupChat);
// DELETE /api/chat/group/:groupId
// Example in Express (routes/chat.js)
router.delete("/:chatId", protectRoute, deleteChat);


export default router;