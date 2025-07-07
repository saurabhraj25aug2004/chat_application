import User from "../models/user.js";
import Message from "../models/message.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../server.js";
import { userOnline } from "../server.js";


//Get all users except logged in//
export const getuserforSidebar = async (req,res) =>{
    try{
        const userId =req.user._id;
        const filteredUser = await User.find({_id:{$ne:userId}}).select("-password")

        //Count of Unseen Messages
        const unseenMessages = {};
        const promise = filteredUser.map(async(user)=>{
            const messages = await Message.find({senderId:user._id,receiverId:userId,seen:false})
            if(messages.length>0)
            {
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promise);
        res.json({success:true,users:filteredUser,unseenMessages})
    }catch(e)
    {
        console.log(e.message);
        res.json({success:false,message:e.message})
    }
}

//Get all messages for selected user
export const getMessages = async (req, res) => {
  try {
    const id = req.params.id;

    // Try finding if it's a group chat
    const isGroupChat = await Chat.findById(id);

    let messages;
    if (isGroupChat) {
      // Group chat: fetch by chatId
      messages = await Message.find({ chatId: id }).populate("senderId", "fullName profilePic");
    } else {
      // Private chat: fetch both directions
      messages = await Message.find({
        $or: [
          { senderId: req.user._id, receiverId: id },
          { senderId: id, receiverId: req.user._id },
        ],
      }).populate("senderId", "fullName profilePic");
    }

    res.json({ success: true, messages });
  } catch (e) {
    console.error("Get messages error:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};


// Mark Messages as Seen
export const markMessage = async(req,res)=>{
    try{
        const {id}=req.params
        await Message.findByIdAndUpdate(id,{seen:true})
        res.json({success:true})
    }
    catch(e)
    {
        console.log(e.message);
        res.json({success:false,message:e.message})
    }
}

//Send Messages To Some user
import Chat from "../models/Chat.js";


export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const paramId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploaded = await cloudinary.uploader.upload(image);
      imageUrl = uploaded.secure_url;
    }

    //  1. Check if it's a valid group chat
    const chat = await Chat.findById(paramId).populate("users", "_id");

    if (chat && chat.isGroupChat) {
      // GROUP CHAT MESSAGE
      const newMessage = await Message.create({
        senderId,
        chatId: chat._id,
        text,
        image: imageUrl,
      });

      // Emit to all members except sender
      chat.users.forEach((user) => {
        if (user._id.toString() !== senderId.toString()) {
          const socketId = userOnline[user._id];
          if (socketId) {
            io.to(socketId).emit("newMessage", newMessage);
          }
        }
      });

      return res.json({ success: true, newMessage });
    }

    //  2. Else treat it as private chat (1-to-1)
    const receiverId = paramId;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: "Receiver ID or Chat ID required" });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    const socketId = userOnline[receiverId];
    if (socketId) {
      io.to(socketId).emit("newMessage", newMessage);
    }

    return res.json({ success: true, newMessage });
  } catch (e) {
    console.error("Send message error:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
};
