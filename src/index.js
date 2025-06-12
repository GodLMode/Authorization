import dotenv from "dotenv";
import connectDB from "./db/index.js";
import {app} from './app.js';
dotenv.config({
    path:'./.env'
})
const port = process.env.PORT;
connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("Error: ",error);
        throw error;
    })
    app.listen(port || 8000 , ()=>{
        console.log(`Server is running on Port ${port}`);
    })
})
.catch((err)=>{
    console.log("MongoDB connection failed!!!", err);
})
;
