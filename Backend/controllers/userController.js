import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs"; 

//User Signup

export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  try {
    if (!fullName || !email || !password || !bio) {
      return res.json({ success: false, message: "Missing Details" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Account Already Exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });

    const token = generateToken(newUser._id);
    res.json({
      success: true,
      userData: newUser,
      token,
      message: "Account Created Successfully",
    });
  } catch (e) {
    console.log(e.message);
    res.json({ success: false, message: e.message });
  }
};

//Login Function

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });
    const isCorrectPassword = await bcrypt.compare(password, userData.password);
    if (!isCorrectPassword) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }
    const token = generateToken(userData._id);
    res.json({ success: true, userData, token, message: "Login Successful" });
  } catch (e) {
    console.log(e.message);
    res.json({ success: false, message: e.message });
  }
};

// Authentication

export const checkAuthentication = (req,res)=>{
    res.json({success:true,user:req.user});
}


//Update of Profile Details

export const updateProfile = async(req,res)=>{
    try{
        const {profilePic,bio,fullName} = req.body
        const userId = req.user._id;
        let updatedUser;
        if(!profilePic)
        {
            updatedUser=await User.findByIdAndUpdate(userId,{bio,fullName},{new:true})
        }
        else
        {
            const upload = await cloudinary.uploader.upload(profilePic);
            updatedUser = await User.findByIdAndUpdate(userId,{profilePic:upload.secure_url,bio,fullName},{new:true})
        }
        res.json({success:true,user:updatedUser})
    }catch(e)
    {
        console.log(e.message)
        res.json({success:false,message:e.message})
    }
}

