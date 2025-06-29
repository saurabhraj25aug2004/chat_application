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
export const getMessages = async(req,res)=>{
    try{
        const {id:selectedUser} = req.params;
        const ownId = req.user._id;
        const messages=await Message.find({$or:[{senderId:ownId,receiverId:selectedUser},{senderId:selectedUser,receiverId:ownId}]})
        await Message.updateMany({senderId:selectedUser,receiverId:ownId},{seen:true});
        res.json({success:true,messages})

    }catch(e)
    {
        console.log(e.message);
        res.json({success:false,message:e.message})
    }
}


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

export const sendMessage = async(req,res)=>{
    try{
        const {text,image} = req.body;
        const receiverId = req.params.id
        const senderId = req.user._id
        let imageUrl;
        if(image)
        {
           const uploadImage =await cloudinary.uploader.upload(image);
           imageUrl = uploadImage.secure_url
        }
        const newMessage = await Message.create({senderId,receiverId,text,image:imageUrl})

        //ReceiverSocket to see the message at receiver site
        const receiverSocketId = userOnline[receiverId]
        if(receiverSocketId)
            io.to(receiverSocketId).emit("newMessage",newMessage)
        res.json({success:true,newMessage});
    }
    catch(e)
    {
        console.log(e.message);
        res.json({success:false,message:e.message})
    }
}