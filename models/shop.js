import mongoose from "mongoose"

const ShopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subscriptionStatus: { type: String, default: 'Active' },
});

export default mongoose.model("Shop", ShopSchema);