const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const inventorySchema = new Schema({
  productName: {
    type: String,
    required: true,
  },
  productPicture: {
    data: Buffer,
    contentType: String,
  },
  productDescription: {
    type: String,
    required: true,
  },
  buyingPrice: {
    type: Number,
    required: true,
  },
  sellingPrice: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  numberOfSales: {
    type: Number,
    default: 0,
  },
});

const businessSchema = new Schema({
  businessName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  whatsAppNumber: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
  },
  location: {
    type: String,
    required: true,
  },
  googleMapsLink: {
    type: String,
  },
  facebookLink: String,
  instagramLink: String,
  twitterLink: String,
  linkedInLink: String,
  businessLogo: {
    data: Buffer,
    contentType: String,
  },
  password: {
    type: String,
    required: true,
  },
  inventory: [inventorySchema],
  isVerified: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  verificationToken: { type: String },
  resetToken: { type: String },
  refreshToken: String,
});

module.exports = mongoose.model("Business", businessSchema);
