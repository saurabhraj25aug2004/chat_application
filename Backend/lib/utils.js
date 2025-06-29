import jwt from "jsonwebtoken";

//Function to generate token for user
export const generateToken = (id)=>{
    const token = jwt.sign({id},process.env.JWTTOKEN)
    return token
}