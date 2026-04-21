import User from "../models/user.js";
import Lead from "../models/lead.js";
import Shop from "../models/shop.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pluralize from "pluralize";

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

    // 4. Sign and generate tokens
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || "fallback_secret_key_change_in_production",
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET || "fallback_refresh_secret",
      { expiresIn: "7d" },
    );

    // 5. Store refresh token in user document
    user.refreshToken = refreshToken;
    await user.save();

    // 6. Set Tokens in HttpOnly Cookies
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    };

    console.log(`[AUTH] Setting cookies for: ${user.email} (Prod: ${isProd})`);
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 7. Send the role and status back to the frontend
    res.status(200).json({
      success: true,
      message: "Login successful",
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
    const { role: creatorRole, shopId: creatorShopId } = req.user;

    // 1. Check if this email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "This email is already registered." });
    }

    // 2. Encrypt (Hash) the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Logic to determine shopId and role
    // If a Shop Admin is registering, they can create an Employee or another Shop Admin for their shop
    let finalRole = role || 'Employee';
    let finalShopId = null;

    if (creatorRole === 'Shop Admin') {
      // Respect provided role but only allow 'Employee' or 'Shop Admin' for their own shop
      if (role !== 'Shop Admin') finalRole = 'Employee';
      finalShopId = creatorShopId;
    } else if (creatorRole === 'Super Admin') {
      finalShopId = req.body.shopId || null;
    }

    // 4. Save the new user to MongoDB
    const newUser = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: finalRole,
      shopId: finalShopId
    });

    res.status(201).json({
      success: true,
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
    res.status(500).json({ success: false, message: "An error occurred while creating the user." });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-passwordHash")
      .populate("shopId", "name products");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Contextual lead count based on strict RBAC tier
    const leadCountQuery = req.user.role === 'Shop Admin' && req.user.shopId
      ? { shopId: req.user.shopId } // Admins see all leads for their shop tenant
      : { createdBy: req.user.userId, shopId: req.user.shopId }; // Employees only see their own
      
    const leadCount = await Lead.countDocuments(leadCountQuery);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shop: user.shopId ? user.shopId.name : null,
        shopProducts: user.shopId ? user.shopId.products : [],
        leadCount,
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
    ).select("-passwordHash").populate("shopId", "name products");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Contextual lead count based on strict RBAC tier
    const leadCountQuery = req.user.role === 'Shop Admin' && req.user.shopId
      ? { shopId: req.user.shopId } // Admins see all leads for their shop tenant
      : { createdBy: userId, shopId: req.user.shopId }; // Employees only see their own
      
    const leadCount = await Lead.countDocuments(leadCountQuery);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        shop: updatedUser.shopId ? updatedUser.shopId.name : null,
        shopProducts: updatedUser.shopId ? updatedUser.shopId.products : [],
        leadCount,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

export const updateShopProducts = async (req, res) => {
  try {
    const { products } = req.body;
    const { shopId } = req.user;

    if (!shopId) {
      return res.status(403).json({ success: false, message: "No shop associated with this user" });
    }

    // Normalize products to singular form
    const normalizedProducts = products.map(p => ({
      ...p,
      productName: pluralize.plural(p.productName.trim())
    }));

    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      { products: normalizedProducts },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Shop products updated successfully",
      products: updatedShop.products,
    });
  } catch (error) {
    console.error("Update Shop Products Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update shop products" });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const { shopId, role } = req.user;

    if (role !== 'Shop Admin' && role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: "Unauthorized: Only Admins can view employees." });
    }

    // Query for all users in this shop, excluding the super admin (unless they are one)
    // We include BOTH Employees and Shop Admins so the owner can manage all staff
    const query = role === 'Super Admin' ? {} : { shopId };
    
    const employees = await User.find(query).select("-passwordHash");

    res.status(200).json({
      success: true,
      employees
    });
  } catch (error) {
    console.error("Get Employees Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch employees" });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId, role } = req.user;

    const userToDelete = await User.findById(id);

    if (!userToDelete) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Check permissions: Shop Admin can only delete from their own shop
    if (role === 'Shop Admin') {
      if (!userToDelete.shopId || userToDelete.shopId.toString() !== shopId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized: You can only delete employees from your own shop." });
      }
    } else if (role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (error) {
    console.error("Delete Employee Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete employee" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role: newRole } = req.body;
    const { role: creatorRole, shopId, userId: creatorId } = req.user;

    // Prevent self-role change
    if (id === creatorId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot change your own role." });
    }

    if (!['Employee', 'Shop Admin'].includes(newRole)) {
      return res.status(400).json({ success: false, message: "Invalid role specified." });
    }

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Permission Check
    if (creatorRole === 'Shop Admin') {
      if (!userToUpdate.shopId || userToUpdate.shopId.toString() !== shopId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized: Access denied to this shop's data." });
      }
    } else if (creatorRole !== 'Super Admin') {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    userToUpdate.role = newRole;
    await userToUpdate.save();

    res.status(200).json({
      success: true,
      message: `Role updated to ${newRole} successfully`,
      role: newRole
    });
  } catch (error) {
    console.error("Update User Role Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update user role" });
  }
};

export const debugCookies = (req, res) => {
  res.json({
    hasAccessToken: !!req.cookies.accessToken,
    hasRefreshToken: !!req.cookies.refreshToken,
    cookieNames: Object.keys(req.cookies || {})
  });
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    console.log("Refresh attempt. Cookies received:", Object.keys(req.cookies));
    
    if (!refreshToken) {
      console.warn("Refresh failed: No refreshToken cookie found in request.");
      return res.status(401).json({ success: false, message: "No refresh token provided" });
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      console.warn("Refresh failed: Token not found in database.");
      return res.status(403).json({ success: false, message: "Invalid refresh token" });
    }

    // Verify token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || "fallback_refresh_secret", async (err, decoded) => {
      if (err) {
        console.error("JWT Verify Error on Refresh:", err.message);
        return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
      }
      
      const payload = { userId: user._id, role: user.role, shopId: user.shopId };

      const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET || "fallback_secret_key_change_in_production",
        { expiresIn: "15m" }
      );

      const newRefreshToken = jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_SECRET || "fallback_refresh_secret",
        { expiresIn: "7d" }
      );

      // Save the new one
      user.refreshToken = newRefreshToken;
      await user.save();

      // Set the new tokens in cookies
      const isProd = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/'
      };

      res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', newRefreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      console.log(`[AUTH] Refreshed tokens for user: ${user.email}`);
      res.status(200).json({
        success: true,
        message: "Token refreshed successfully"
      });
    });
  } catch (error) {
    console.error("Refresh Token Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to refresh token" });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const user = await User.findOneAndUpdate({ refreshToken }, { $unset: { refreshToken: 1 } });
    }
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to logout" });
  }
};
