import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    let token = req.cookies.accessToken || req.header("Authorization");

    if (!token) {
      return res.status(401).json({ message: "No authentication token provided." });
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trim();
    }

    const verified = jwt.verify(
      token, 
      process.env.JWT_SECRET || "fallback_secret_key_change_in_production"
    );
    req.user = verified; 
     
    next(); 
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};