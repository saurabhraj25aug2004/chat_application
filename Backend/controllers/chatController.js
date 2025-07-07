import Chat from '../models/Chat.js';
import { io } from '../server.js';
import User from '../models/user.js';
export const createGroupChat = async (req, res) => {
  const { name, users } = req.body;
  if (!name || !users) return res.status(400).json({ message: 'Name & users required' });

  const groupChat = await Chat.create({
    chatName: name,
    users: [...users, req.user._id],
    isGroupChat: true,
    groupAdmin: req.user._id
  });

  const fullChat = await Chat.findById(groupChat._id).populate('users', '-password').populate('groupAdmin', '-password');
  io.emit("groupCreated", fullChat);
  res.status(201).json(fullChat);
};

export const fetchChats = async (req, res) => {
  const chats = await Chat.find({ users: { $in: [req.user._id] } })
    .populate('users', '-password')
    .populate('groupAdmin', '-password')
    .sort({ updatedAt: -1 });
  res.json(chats);
};


export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    await Chat.findByIdAndDelete(chat._id);
    io.emit("groupDeleted", chat._id);
    res.status(200).json({ success: true, message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

