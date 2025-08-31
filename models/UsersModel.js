const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
    },
    password:{
        type:String,
        required:true
    },
    address:String,
    mobile:String,
    role: { type: String, enum: ["user", "admin"], default: "user" }
},{timestamp:true})

module.exports=mongoose.model("users",userSchema);