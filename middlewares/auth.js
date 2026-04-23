import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    const cookieToken = req.cookies.accessToken;
    const headerToken = req.header("Authorization");
    
    let token = cookieToken || headerToken;

    if (!token || token === "undefined") {
      return res.status(401).json({ message: "No authentication token provided." });
    }

    if (typeof token === 'string' && token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trim();
    }

    try {
      const verified = jwt.verify(
        token, 
        process.env.JWT_SECRET || "fallback_secret_key_change_in_production"
      );
      req.user = verified; 
      next();
    } catch (jwtErr) {
      res.status(401).json({ message: "Invalid or expired token." });
    }
  } catch (err) {
    console.error(`[AUTH] Middleware Error: ${err.message}`);
    res.status(500).json({ message: "Internal server error during authentication" });
  }
};