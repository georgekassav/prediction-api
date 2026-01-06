import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from './common/config/passport';
import { config } from './common/config/config';
import { errorHandler } from './common/middleware/errorHandler';
import routes from './routes';

const app = express();

// Middleware
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

export default app;
