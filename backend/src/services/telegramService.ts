import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { TELEGRAM_API_HASH, TELEGRAM_API_ID } from "../server";
import { PrismaClient } from "@prisma/client";
import { startListeningForMessages } from "./telegramEvents";

const prisma = new PrismaClient();

// Store active clients globally
export const globalClients: Record<string, TelegramClient> = {};

// Helper to create a new Telegram client
const createClient = (sessionString: string): TelegramClient => {
    const session = new StringSession(sessionString);
    const client = new TelegramClient(session, TELEGRAM_API_ID, TELEGRAM_API_HASH, {
        connectionRetries: 5,
    });

    return client;
};

// Initialize Telegram Login
export const initTelegramLogin = async (phoneNumber: string): Promise<void> => {
    const client = createClient("");
    await client.connect();

    globalClients[phoneNumber] = client;

    await client.sendCode(
        {
            apiId: TELEGRAM_API_ID,
            apiHash: TELEGRAM_API_HASH,
        },
        phoneNumber
    );

    console.log("Telegram login initialized: OTP sent.");
};

// Verify OTP and Save Session to Database
export const verifyTelegramOtp = async (
    phoneNumber: string,
    otp: string,
    password: string
): Promise<void> => {
    const client = globalClients[phoneNumber];

    if (!client) {
        throw new Error("Client not found for phone number: " + phoneNumber);
    }

    await client.start({
        phoneNumber: phoneNumber,
        password: async () => password, // Handle passwords if 2FA is enabled
        phoneCode: async () => otp,
        onError: (err: any) => console.error("Telegram Error:", err),
    });

    const sessionString = String(client.session.save());

    // Save session to the database
    await prisma.session.upsert({
        where: {
            phoneNumber: phoneNumber,
        },
        update: {
            sessionData: sessionString,
            password: password,
        },
        create: {
            phoneNumber: phoneNumber,
            password: password,
            sessionData: sessionString,
        },
    });

    console.log("Session saved for phone:", phoneNumber);
    startListeningForMessages(client);
};

// Load Session from Database
export const loadSession = async (
    phoneNumber: string
): Promise<TelegramClient | null> => {
    const sessionRecord = await prisma.session.findUnique({
        where: { phoneNumber: phoneNumber },
    });

    if (!sessionRecord) {
        console.log("No session found for phone:", phoneNumber);
        return null;
    }

    const client = createClient(sessionRecord.sessionData);

    await client.connect();

    globalClients[phoneNumber] = client;

    console.log("Session loaded for phone:", phoneNumber);
    return client;
};

// Disconnect and Remove Session from Database
export const removeSession = async (phoneNumber: string): Promise<void> => {
    const client = globalClients[phoneNumber];

    if (client) {
        await client.disconnect();
        delete globalClients[phoneNumber];
    }

    await prisma.session.delete({
        where: { phoneNumber: phoneNumber },
    });

    console.log("Session removed for phone:", phoneNumber);
};
