import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true, // Removes accidental spaces at the beginning or end
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Location or Zip Code is required'],
    trim: true,
  },
  gpsCoordinates: {
    type: String,
    trim: true,
  },
  state: {
    type: String,
    trim: true,
  },
  district: {
    type: String,
    trim: true,
  },
  budget: {
    type: Number,
    required: [true, 'Estimated budget is required'],
    min: [0, 'Budget cannot be a negative number'],
  },
  productInterest: {
    type: String,
    required: [true, 'Product interest is required'],
    trim: true,
  },

  createdBy: {
    // This securely links the lead to the specific Employee who logged it
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'In Progress', 'Closed Won', 'Closed Lost'], 
    default: 'New'
  }
}, {
  // Automatically creates 'createdAt' and 'updatedAt' timestamps!
  timestamps: true 
});

export default mongoose.model('Lead', leadSchema);