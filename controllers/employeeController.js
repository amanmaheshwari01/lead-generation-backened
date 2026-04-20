import Lead from '../models/lead.js';
import User from '../models/user.js'; // Required for .populate('createdBy') to work reliably

export const createNewLead = async (req, res) => {
  try {
    const { 
      customerName, 
      phoneNumber, 
      area,
      gpsCoordinates,
      state,
      district,
      city,
      budget, 
      productInterest 
    } = req.body;

    // Extract the ID and securely bound shop of the employee who is currently logged in
    const employeeId = req.user.userId; 
    const shopId = req.user.shopId;

    if (!shopId) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You must be associated with a Shop to create leads."
      });
    }

    if (!customerName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Customer Name and Phone Number are required." 
      });
    }

    const newLead = await Lead.create({
      customerName,
      phoneNumber,
      location: area,
      gpsCoordinates: gpsCoordinates || '',
      state: state || '',
      district: district || '',
      city: city || '',
      budget,
      productInterest,
      createdBy: employeeId, 
      shopId,
    });
    console.log("new Lead is : ", newLead);
    res.status(201).json({
      success: true,
      message: "Lead created successfully!",
      lead: newLead 
    });

  } catch (error) {
    console.error("Error creating lead:", error);
    
    // Handle specific database validation errors (e.g., missing fields, wrong data types)
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message 
    });
    }

    res.status(500).json({
        success: false,
        message: "An internal server error occurred while saving the lead." 
    });
  }
};

export const getMyLeads = async (req, res) => {
  try {
    const { userId, shopId, role } = req.user;

    // 1. Build query intelligently based on RBAC role
    let query = {};
    
    if (role === 'Super Admin') {
      // Super Admin should ideally see everything globally
      query = {};
    } else if (role === 'Shop Admin') {
      // Shop Admins see all leads for their specific shop tenant
      if (!shopId) throw new Error("Shop Admin must have an associated shopId");
      query = { shopId };
    } else {
      // Employees see ONLY their own leads, strictly bound to their shop
      if (!shopId) throw new Error("Employee must have an associated shopId");
      query = { createdBy: userId, shopId };
    }

    // 2. Fetch with population and logging for debug
    const leads = await Lead.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      leads: leads
    });

  } catch (error) {
    console.error("Backend Error [getMyLeads]:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while fetching your leads."
    });
  }
};



