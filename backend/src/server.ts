import app from './app';
import {
  createTelegramClient,
  isSessionValid,
} from './services/telegramService';
import seed from './seed'; // Import the seed function

import './tasks/analyticsJob'
import dotenv from "dotenv"


// Start the server and initialize Telegram clien
dotenv.config()
export const TELEGRAM_API_ID = process.env.TELEGRAM_API_ID || (() => { throw new Error("TELEGRAM_API_ID is not defined"); })();
export const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH || (() => { throw new Error("TELEGRAM_API_HASH is not defined"); })();
export const TELEGRAM_PHONE = process.env.TELEGRAM_PHONE || (() => { throw new Error("TELEGRAM_API_PHONE is not defined"); })();

export const DATABASE_URL = process.env.DATABASE_URL || (() => { throw new Error("DATABASE_URL is not defined"); })();
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (() => { throw new Error("ADMIN_PASSWORD is not defined"); })();

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || (() => { throw new Error("OPENAI_API_KEY is not defined"); })();
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || (() => { throw new Error("OPENAI_BASE_URL is not defined"); })();

export const PORT = process.env.PORT || 3001;

export const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error("JWT_SECRET is not defined"); })();
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION || (() => { throw new Error("JWT_EXPIRATION is not defined"); })();


// Run the seeding script when the server starts
seed()
  .then(() => {
    // Start the server after seeding

    app.listen(PORT, async () => {
      try {
        // Check if a session exists and is valid
        const session = await isSessionValid(TELEGRAM_PHONE);
        if (!session) {
          console.log(
            'No valid session found. You need to authenticate telegram...'
          );
        } else {
          console.log('Session is valid. Client initialized successfully!');
        }

        console.log(`Server is running on port ${PORT}`);
      } catch (error) {
        console.error('Error during server startup:', error);
      }

      console.log(`Backend is listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error during initial data setup:', error);
    process.exit(1); // Exit if seeding fails
  });
