import mongoose from "mongoose"

const ProductSchema = new mongoose.Schema({
  productName: { type: String, required: true },
});

const ShopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  products: { type: [ProductSchema], default: [] },
  subscriptionStatus: { type: String, default: 'Active' },
});

export default mongoose.model("Shop", ShopSchema);