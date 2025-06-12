import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = mongoose.Schema({
    userName:{
        type:String,
        required:true,
        lowercase:true,
        min:[3,"Username should atleast be 3 characters"],
        trim:[true,"Username is required"],
        index:true
    },
    fullName:{
        type:String,
        required:[true, "Full name is required"],
        trim:true
    },
    email:{
        type:String,
        required:true,
        lowercase:[true,"Email is required"],
        trim:true
    },
    password:{
        type:String,
        required:true,
        min:[6,"Atleast 6 characters are required"]
    },
    refreshToken:{
        type:String,
    }
},{timestamps:true});

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password,10);
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
        _id:this._id,
        email:this.email,
        password:this.password
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }   
    )
}

userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign(
        {
        _id:this._id,
        },
        process.env.REFRESH_TOKEN_ACCESS,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }   
    )
}

const User = mongoose.model('User',userSchema);
export {User};