const mongoose=require('mongoose');

const productSchema=new mongoose.Schema({
    name:{type:String,required:true},
    category:{type:String,required:true},
    price:{type:Number,required:true},
    image:{type:String,default:null},
    description:{type:String,default:"No description yet"},
    inStock: { type: Boolean, default: true },
    keywords: [{ type: String,required:true }],


    // for offers section 
    expiryDate: {
  type: Date,
  default:null
},

  // for offers
  isOffer: { type: Boolean, default: false },
  offerType: { type: String, default: null },
  discountPercentage: { type: Number, default: 0 },

})

module.exports=mongoose.model("product",productSchema);

