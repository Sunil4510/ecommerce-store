import express, { Request, Response, NextFunction } from 'express';
import apiRoutes from './routes/index.js';

const app = express();

// Standard middleware
app.use(express.json());

// Base status check endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    message: 'Welcome to the E-Commerce Store REST API.',
    timestamp: new Date(),
  });
});

// API endpoints mounting
app.use('/api', apiRoutes);

// 404 Fallback Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint '${req.originalUrl}' not found.`,
  });
});

// Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred on the server.',
  });
});

export default app;
