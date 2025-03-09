import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './database/index';
import taxAnalysisRoutes from './routes/taxAnalysis.routes';
import documentProcessingRoutes from './routes/documentProcessing.routes';
import recommendationRoutes from './routes/recommendation.routes';
import errorHandler from './middleware/error.middleware';
import { authenticate } from './middleware/auth.middleware';
import logger from './utils/logger';

// Initialize express app
const app = express();
const PORT = process.env.PORT || 8084;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('combined'));

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'ai-service' });
});

// Apply auth middleware to all routes except health check
app.use('/api/tax-analysis', authenticate, taxAnalysisRoutes);
app.use('/api/document-processing', authenticate, documentProcessingRoutes);
app.use('/api/recommendations', authenticate, recommendationRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.info(`AI service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();