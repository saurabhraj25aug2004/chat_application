import express from 'express';
import "dotenv/config";
import cors from 'cors'
import http from 'http'
import { connectDB } from './lib/db.js';
import userRouter from './Routes/userRoutes.js';
import messageRouter from './Routes/messageRoutes.js';
import { Server } from 'socket.io';
import chatRoutes from './Routes/chatRoutes.js';

const app = express();
const server =http.createServer(app)

//Socket Io Initialization
export const io = new Server(server,{
    cors:{origin:"*"}
})
//Store Online users
export const userOnline ={}

//Socket Connection Handler Function
io.on("connection",(socket)=>{
    const userId=socket.handshake.query.userId;
    console.log("User is Connected",userId);
    if(userId)
        userOnline[userId]=socket.id

    //Emit online 
    io.emit("getOnlineUsers",Object.keys(userOnline));
    socket.on("disconnect",()=>{
        console.log("User Disconnected",userId);
        delete userOnline[userId];
        io.emit("getOnlineUsers",Object.keys(userOnline))
    })
})
//Middlewares 
app.use(express.json({limit:"5mb"}));
app.use(cors());

//Routes
app.use("/api/status",(req,res)=>{
    res.send("Server is Running")
})

app.use("/api/auth",userRouter)
app.use("/api/messages",messageRouter)
app.use('/api/chat', chatRoutes);


//Connect with DB
await connectDB();
const port = process.env.PORT || 5000

server.listen(port,()=>{
    console.log(`Server is Running on ${port}`);
})