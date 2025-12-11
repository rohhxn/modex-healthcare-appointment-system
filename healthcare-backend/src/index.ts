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

// Initialize database on startup
const initializeApp = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Routes
    app.use('/api/doctors', doctorRoutes);
    app.use('/api/patients', patientRoutes);
    app.use('/api/appointments', appointmentRoutes);

    // Error handling middleware
    app.use(errorHandler);

    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    process.exit(1);
  }
};

// Initialize the app
initializeApp();

// Export for Vercel serverless
export const handler = serverless(app);

// Local server startup (for local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Healthcare Appointment API running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  });
}

export default app;
