import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500 , "Something went wrong while generating refresh and access token");
    }
}
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
    console.log("congrats ! , user registered Successfully")
    return res.status(201).json( new ApiResponse(
        200,
        isUserCreated,
        "User registered Successfully",
    ))

})

const loginUser = asyncHandler(async(req,res)=>{
    const {email,password} = req.body;
    if(!email || !password){
        throw new ApiError(409,"All fields are required");
    }
    const user = await User.findOne({email});
    if(!user){
        throw new ApiError(404,"Invalid Credentials , please provide correct credentials");
    }
    const isCorrectUSer = await user.isPasswordCorrect(password);
    if(!isCorrectUSer){
        throw new ApiError(402,"Please enter correct Password");
    }
    // if both exists then -> is ko login krwa do
    const {accessToken , refreshToken } = await generateAccessAndRefreshToken(user._id);
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    

    const options = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,{
        user:loggedInUser,
        accessToken,refreshToken
    },"User logged in Successfully"));
})


const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
              .clearCookie("accessToken",options)
              .clearCookie("refreshToken",options)
              .json(new ApiResponse(200,{},"User logged out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken|| req.body.refreshToken 

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request");
    }
    
    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    
        const user = User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token");
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used");
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken ,newRefreshToken } = await generateAccessAndRefreshToken(user._id);
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken : newRefreshToken},
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invoid old Password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
           .status(200)
           .json(new ApiResponse(200,{},"Password Changed Successfully"))

})  

export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword};