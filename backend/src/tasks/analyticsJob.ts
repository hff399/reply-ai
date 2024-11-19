import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Cron job to delete analytics older than a month
cron.schedule('0 0 * * 0', async () => { // Runs every Sunday at midnight
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1); // Set the date to one month ago

    console.log(`Deleting analytics entries older than: ${oneMonthAgo}`);

    // Delete analytics entries older than 1 month
    const result = await prisma.analytics.deleteMany({
      where: {
        createdAt: {
          lt: oneMonthAgo, // 'lt' means less than
        },
      },
    });

    console.log(`Deleted ${result.count} analytics entries older than a month.`);
  } catch (error) {
    console.error('Error deleting old analytics:', error);
  }
});

console.log('Cron job to delete old analytics is scheduled to run weekly.');
