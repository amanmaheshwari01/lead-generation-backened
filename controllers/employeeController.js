import Lead from '../models/lead.js';

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

    // Extract the ID of the employee who is currently logged in
    const employeeId = req.user.userId; 

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
    // 1. Grab the employee's ID from the verified token
    const employeeId = req.user.userId;

    // 2. Find all leads created by this employee
    const leads = await Lead.find({ createdBy: employeeId }).sort({ createdAt: -1 });

    // 3. Send them back to the frontend
    res.status(200).json({
      success: true,
      leads: leads
    });

  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching your leads."
    });
  }
};

export const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    const employeeId = req.user.userId;

    // Security Check: Find the lead AND make sure this employee owns it
    const updatedLead = await Lead.findOneAndUpdate(
      { _id: id, createdBy: employeeId }, 
      { status: status },
      { new: true } // Tells Mongoose to return the newly updated document
    );

    if (!updatedLead) {
      return res.status(404).json({ 
        success: false, 
        message: "Lead not found or you do not have permission to edit it." 
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully!",
      lead: updatedLead
    });

  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ success: false, message: "Server error updating status." });
  }
};

