import express from "express"
import {createNewLead, getMyLeads} from  "../controllers/employeeController.js";
import { verifyToken } from "../middlewares/auth.js";

const employeeRouter = express.Router();

employeeRouter.post('/createNewLead', verifyToken, createNewLead);
employeeRouter.get('/myLeads', verifyToken, getMyLeads);
 
export default employeeRouter 