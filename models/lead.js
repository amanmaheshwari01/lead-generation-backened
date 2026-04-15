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
  city: {
    type: String,
    trim: true,
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be a negative number'],
  },
  productInterest: {
    type: [String],
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