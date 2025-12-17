const mongoose = require("mongoose");

const productAdditionalInfoSchema = new mongoose.Schema({
  "name-url": {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  features: {
    type: [String],
  },
  healthBenefits: {
    type: [String],
  },
  tasteTexture: {
    type: [String],
  },
  howToUse: {
    type: [String],
  },
  storageGuidelines: {
    type: String,
  },
  additionalInfo: {
    manufacturer: {
      type: String,
    },
    shelfLife: {
      type: String,
    },
    brand: {
      type: String,
    },
    origin: {
      type: String,
    },
    fssaiLicense: {
      type: String,
    },
  },
  usps: {
    type: [String],
  },
   video: {
    type: String,
  },
  otherReviews:[{
    platform:{type:String},
    rating:{type:Number},
    totalReviews:{type:Number},
    url:{type:String}
  }],
  additionalImages:{
    type: [String],
  },
  faqs:[
    {
      q:{type:String},
      a:{type:String}
    }
  ]
});

const ProductAdditionalInfo = mongoose.model(
  "ProductAdditionalInfo",
  productAdditionalInfoSchema
);

module.exports = ProductAdditionalInfo;
