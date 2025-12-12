// @ts-nocheck
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import serverless from 'serverless-http';
import { connectDB } from './config/database';
import doctorRoutes from './routes/doctors';
import patientRoutes from './routes/patients';
import appointmentRoutes from './routes/appointments';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Healthcare Appointment System is running' });
});

// Lazy database initialization - connect on first request
let dbConnected = false;
const ensureDBConnected = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }
};

// Middleware to ensure DB connection before routes
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDBConnected();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);

// Error handling middleware
app.use(errorHandler);

// Export for Vercel serverless
export const handler = serverless(app);

// Local server startup (for local development)
if (require.main === module) {
  app.listen(PORT, async () => {
    try {
      await ensureDBConnected();
      console.log(`🚀 Healthcare Appointment API running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  });
}

export default app;

