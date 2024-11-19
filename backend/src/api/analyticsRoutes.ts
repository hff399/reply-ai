// src/api/analyticsRoutes.ts
import express, { Request, Response } from 'express';
import prisma from '../utils/prismaClient'; // Assuming you've set up Prisma client
import { AnalyticsService } from '../services/analyticsService';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Route: Get message counts for the last month
router.get('/overview', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Use the AnalyticsService to get the message counts for the last month
    const lastMonthMessageCounts = await AnalyticsService.getLastMonthMessageCounts();

    // Return the formatted data for last month's message counts
    res.json(lastMonthMessageCounts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching last month message counts' });
  }
});

export default router;
