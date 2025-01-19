import app from './app';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import seed from './seed';
import './tasks/analyticsJob';
import { startListeningForMessages } from './services/telegramEvents';
import { globalClients } from './services/telegramService';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'TELEGRAM_API_ID',
  'TELEGRAM_API_HASH',
  'DATABASE_URL',
  'ADMIN_PASSWORD',
  'JWT_SECRET',
  'JWT_EXPIRATION',
];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`${varName} is not defined`);
  }
});

// Export environment variables
export const TELEGRAM_API_ID = Number(process.env.TELEGRAM_API_ID);
export const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH || "";
export const DATABASE_URL = process.env.DATABASE_URL;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
export const PORT = process.env.PORT || 3001;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION;

const prisma = new PrismaClient();

// Utility function to create a Telegram client
const createTelegramClient = (sessionData: string): TelegramClient => {
  const session = new StringSession(sessionData);
  const client = new TelegramClient(session, TELEGRAM_API_ID, TELEGRAM_API_HASH, {
    connectionRetries: 5,
  });
  
  startListeningForMessages(client)

  return client
};

// Utility function to initialize Telegram sessions
async function initializeTelegramSessions(): Promise<void> {
  try {
    const sessions = await prisma.session.findMany();

    if (sessions.length === 0) {
      console.warn('No sessions found in the database. Skipping initialization.');
      return;
    }

    for (const session of sessions) {
      try {
        const client = createTelegramClient(session.sessionData);
        await client.connect();

        globalClients[session.phoneNumber] = client

        console.log(`Successfully started Telegram client for phone number: ${session.phoneNumber}`);
      } catch (error) {
        console.error(`Failed to start Telegram client for phone number: ${session.phoneNumber}`, error);
      }
    }
  } catch (error) {
    console.error('Error fetching sessions from the database:', error);
    throw error;
  }
}

// Main startup sequence
async function startServer() {
  try {
    console.log('Running initial seed...');
    await seed();
    console.log('Seed completed successfully.');

    console.log('Initializing Telegram sessions...');
    await initializeTelegramSessions();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error during server startup:', error);
    process.exit(1); // Exit with failure
  }
}

startServer();
