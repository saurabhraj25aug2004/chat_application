import express from 'express'
import { checkAuthentication, login, signup, updateProfile } from '../controllers/userController.js';
import { protectRoute } from '../Middlewares/auth.js';

const userRouter = express.Router();

userRouter.post("/signup",signup)
userRouter.post("/login",login)
userRouter.put("/update",protectRoute,updateProfile)
userRouter.get("/check",protectRoute,checkAuthentication)

export default userRouter;