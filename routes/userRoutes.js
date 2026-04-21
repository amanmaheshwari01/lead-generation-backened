import express from "express"
import {userLogin, registerUser, getProfile, updateProfile, updateShopProducts, getEmployees, deleteEmployee, updateUserRole, refreshAccessToken, logoutUser} from  "../controllers/userControllers.js";
import {verifyToken} from "../middlewares/auth.js"

const UserRouter = express.Router();
 
UserRouter.post('/login', userLogin);
UserRouter.post('/refresh', refreshAccessToken);
UserRouter.post('/logout', logoutUser);
UserRouter.get('/debug/cookies', (req, res) => {
  res.json({
    hasAccessToken: !!req.cookies.accessToken,
    hasRefreshToken: !!req.cookies.refreshToken,
    cookieNames: Object.keys(req.cookies || {})
  });
});
UserRouter.post('/register', verifyToken, registerUser);
UserRouter.get('/profile', verifyToken, getProfile);
UserRouter.put('/profile', verifyToken, updateProfile);
UserRouter.put('/shop/products', verifyToken, updateShopProducts);
UserRouter.get('/employees', verifyToken, getEmployees);
UserRouter.delete('/employees/:id', verifyToken, deleteEmployee);
UserRouter.put('/employees/:id/role', verifyToken, updateUserRole);

export default UserRouter;