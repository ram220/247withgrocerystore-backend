const mongoose=require('mongoose');

const connectDb=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI,{
            useNewUrlParser:true
        })
        console.log("data base connected")
    }
    catch(err){
        console.log("error while connecting to database",err)
    }
}

module.exports=connectDb;