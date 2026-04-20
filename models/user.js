import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Employee', 'Shop Admin', 'Super Admin'], required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
});

export default mongoose.model("User", UserSchema);