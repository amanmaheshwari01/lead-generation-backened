import express from "express"
import {createNewLead, getMyLeads, updateLeadStatus} from  "../controllers/employeeController.js";
import { verifyToken } from "../middlewares/auth.js";

const employeeRouter = express.Router();

employeeRouter.post('/createNewLead', verifyToken, createNewLead);
employeeRouter.get('/myLeads', verifyToken, getMyLeads);
employeeRouter.patch('/leads/:id/status', verifyToken, updateLeadStatus);
 
export default employeeRouter 