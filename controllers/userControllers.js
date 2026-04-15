import User from "../models/user.js";
import "../models/shop.js"; // Register Shop model for populate
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Email doesn't exist" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid password" 
      });
    }

    // 3. Create the JWT Payload
    const payload = {
      userId: user._id,
      role: user.role,
      shopId: user.shopId, // This will be null for Super Admins, but required for others
    };

    // 4. Sign and generate the token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "fallback_secret_key_change_in_production",
      { expiresIn: "120m" },
    );

    // 5. Send the token and role back to the frontend
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      role: user.role,
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Check if this email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "This user is already registered." });
    }

    // 2. Encrypt (Hash) the password so hackers can't read it in the database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Save the new user to MongoDB
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'employee' // Default to employee if no role is provided
    });

    res.status(201).json({
      message: "User created successfully!",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "An error occurred while creating the user." });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-passwordHash")
      .populate("shopId", "name");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shop: user.shopId ? user.shopId.name : null,
      },
    });
  } catch (error) {
    console.error("Profile Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.userId;

    // Check if email is already taken by another user
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: userId } });
      if (existing) {
        return res.status(400).json({ success: false, message: "Email is already in use" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...(name && { name }), ...(email && { email }) },
      { new: true, runValidators: true }
    ).select("-passwordHash").populate("shopId", "name");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        shop: updatedUser.shopId ? updatedUser.shopId.name : null,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};
