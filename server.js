import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './config/db.js'
import userRoutes from './routes/userRoutes.js'
import employeeRouter from './routes/employeeRoutes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());

// Allow all origins — CORS is handled via Next.js rewrites (proxy)
app.use(cors());

app.use(express.json());

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

// Connect to DB (with caching for serverless cold starts)
let isConnected = false;
const ensureDbConnected = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

// Middleware to ensure DB connection before handling requests
app.use(async (req, res, next) => {
  try {
    await ensureDbConnected();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Home route — EJS page
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Lead Generation API',
    status: 'Running',
    timestamp: new Date().toLocaleString()
  });
});

app.use('/user', userRoutes);
app.use('/employee', employeeRouter);

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless
export default app;