const mongoose=require('mongoose');

const productSchema=new mongoose.Schema({
    name:{type:String,required:true},
    category:{type:String,required:true},
    price:{type:Number,required:true},
    image:{type:String,required:true},
    description:{type:String,required:true,default:"No description yet"},
    inStock: { type: Boolean, default: true },
    keywords: [{ type: String,required:true }]
})

module.exports=mongoose.model("product",productSchema);

