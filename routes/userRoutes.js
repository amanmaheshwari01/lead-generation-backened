import express from "express"
import {userLogin, registerUser, getProfile, updateProfile} from  "../controllers/userControllers.js";
import {verifyToken} from "../middlewares/auth.js"

const UserRouter = express.Router();
 
UserRouter.post('/login', userLogin);
UserRouter.post('/register', verifyToken, registerUser);
UserRouter.get('/profile', verifyToken, getProfile);
UserRouter.put('/profile', verifyToken, updateProfile);

export default UserRouter; 