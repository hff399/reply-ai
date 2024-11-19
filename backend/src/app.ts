import express from 'express';
import settingsRoutes from './api/settingsRoute';
import chatSettingsRoutes from './api/chatSettingsRoutes';
import analyticsRoutes from './api/analyticsRoutes';
import telegramRoutes from './api/telegramRoutes'
import authRoutes from './api/authRoutes'
import cors from 'cors';

const app = express();

// CORS setup: allow requests from 'http://localhost:3000'
const corsOptions = {
  origin: 'http://localhost:3000', // Allow frontend to connect
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allow necessary HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers
  credentials: true, // Allow cookies and session credentials (if applicable)
};

// Use the CORS middleware with the specified options
app.use(cors(corsOptions));


app.use(express.json());

// Base route that will respond with "Welcome to API"
app.get('/', (req, res) => {
  res.send('Welcome to API');
});

// Uncomment to enable other routes
app.use('/api/settings', settingsRoutes);
app.use('/api/chats', chatSettingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/auth', authRoutes);

export default app;
