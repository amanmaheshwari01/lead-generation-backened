import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { connectDB } from './config/db.js'
import userRoutes from './routes/userRoutes.js'
import employeeRouter from './routes/employeeRoutes.js'

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

await connectDB(); 

app.use('/user', userRoutes);
app.use('/employee', employeeRouter);

const PORT = process.env.PORT || 5000;
 
app.listen(process.env.PORT, ()=>{
    console.log(`Server running on port ${process.env.PORT}`);
})