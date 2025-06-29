import User from "../models/user.js"
import jwt from "jsonwebtoken"



export const protectRoute = async(req,res,next)=>{
    try{
        const token = req.headers.token;
        const decode = jwt.verify(token,process.env.JWTTOKEN)
        const user = await User.findById(decode.id).select("-password");
        if(!user)
            return res.json({success:false,message:"User Not Found"});
        req.user = user;
        next();
    }catch(e)
    {
        console.log(e.message)
        res.json({success:false,message:e.message});
    }
}