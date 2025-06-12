import { asyncHandler } from "../utils/asyncHandler";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async(req,res)=>{
  const {fullName , email,username , password } = req.body;
  if(
    [fullName,email,username,password].some((field)=> field?.trim()==="")){
      throw new ApiError(400,"All fields are requried");
    }
    const existedUser = await User.findOne({
        $or: [{email},{username}]
    })
    if(existedUser){
        throw new ApiError(409 , "User with email or username already exists");
    }
    const user = await User.create({
        fullName,
        email,
        password,
        username:username.toLowerCase()
    })
    const isUserCreated = await User.findById(user._id)
                                    .select("-password -refreshToken");
    
    if(!isUserCreated){
        throw new ApiError(500 , "Something went wrong while registering the user");
    }
    return res.status(201).json( new ApiResponse(
        200,
        createdUser,
        "User registered Successfully",
    ))

})


export {registerUser};