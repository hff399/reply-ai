import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import fs from 'fs';
import path from 'path';
import { startListeningForMessages } from './telegramEvents';
import { TELEGRAM_API_HASH, TELEGRAM_API_ID } from '../server';

const SESSION_DIR = path.join(__dirname, 'sessions');

// Ensure the session directory exists
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR);

let globalClient: TelegramClient | null = null; // In-memory storage for the client
let otpRequest: { resolve: (value: string) => void; reject: (reason?: any) => void } | null = null;

// Export globalClient for use in other modules
export { globalClient };

/**
 * Initialize a Telegram client using a session or login credentials.
 */
export async function createTelegramClient(
  phone: string,
  password?: string
): Promise<TelegramClient> {
  if (globalClient) {
    console.log('Using existing client');
    return globalClient;
  }

  const stringSession = loadSessionAsStringSession(phone);
  const client = new TelegramClient(stringSession, parseInt(TELEGRAM_API_ID), TELEGRAM_API_HASH, {});
 
  try {
    await client.start({
      phoneNumber: phone,
      phoneCode: () =>
        new Promise<string>((resolve, reject) => {
          otpRequest = { resolve, reject };
        }),
      password: () => Promise.resolve(password || ''),
      onError: (err) => console.error('Error during login:', err),
    });

    globalClient = client; // Cache the authenticated client
    await saveSession(phone, client.session.save()!); // Persist the session

    const loginMessage = `Login at ${formatDate(new Date())} was successful`;
    await client.sendMessage('me', { message: loginMessage });

    console.log('Telegram client authenticated successfully');
    startListeningForMessages(client);

    return client;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}

/**
 * Submit the OTP code received during authentication.
 */
export function setOtpCode(code: string): void {
  if (otpRequest) {
    otpRequest.resolve(code);
    otpRequest = null;
  } else {
    console.error('No pending OTP request to resolve');
  }
}

/**
 * Verify if a session for the given phone number is valid.
 */
export async function isSessionValid(phone: string): Promise<boolean> {
  const sessionData = loadSession(phone);
  if (!sessionData) return false;

  try {
    // Reuse the main `createTelegramClient` function to validate the session
    const client = await createTelegramClient(phone);
    await client.connect(); // Attempt to connect using the session
    return true;
  } catch (error) {
    console.error('Session validation failed:', error);
    return false;
  }
}

/**
 * Load a session from disk for a given phone number.
 */
function loadSession(phone?: string): string | null {
  if (!phone) return null;
  const sessionFilePath = path.join(SESSION_DIR, `${phone}_session.json`);
  if (fs.existsSync(sessionFilePath)) {
    return fs.readFileSync(sessionFilePath, 'utf-8');
  }
  return null;
}

/**
 * Convert session data to a StringSession object.
 */
function loadSessionAsStringSession(phone?: string): StringSession {
  const sessionData = loadSession(phone);
  return new StringSession(sessionData || '');
}

/**
 * Save a session to disk.
 */
function saveSession(phone?: string, sessionData?: string): void {
  if (!phone || !sessionData) return;
  const sessionFilePath = path.join(SESSION_DIR, `${phone}_session.json`);
  fs.writeFileSync(sessionFilePath, sessionData, 'utf-8');
}

/**
 * Format a date into a human-readable string.
 */
function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
