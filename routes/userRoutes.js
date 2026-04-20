import express from "express"
import {userLogin, registerUser, getProfile, updateProfile, updateShopProducts, getEmployees, deleteEmployee} from  "../controllers/userControllers.js";
import {verifyToken} from "../middlewares/auth.js"

const UserRouter = express.Router();
 
UserRouter.post('/login', userLogin);
UserRouter.post('/register', verifyToken, registerUser);
UserRouter.get('/profile', verifyToken, getProfile);
UserRouter.put('/profile', verifyToken, updateProfile);
UserRouter.put('/shop/products', verifyToken, updateShopProducts);
UserRouter.get('/employees', verifyToken, getEmployees);
UserRouter.delete('/employees/:id', verifyToken, deleteEmployee);

export default UserRouter; 