import express, { Request, Response } from 'express';
import {
    initTelegramLogin,
    verifyTelegramOtp,
    loadSession,
    removeSession,
} from '../services/telegramService'; // Adjust the path as needed
import prisma from '../utils/prismaClient';

const router = express.Router();

// /auth/start
router.post('/start', async (req: Request, res: Response) => {
    const { phone, password } = req.body;

    try {
        await initTelegramLogin(phone);
        res.status(200).send({ message: 'OTP sent to your phone.' });
    } catch (error) {
        console.error('Error initiating Telegram login:', error);
        res.status(500).send({ error: 'Failed to send OTP.' });
    }
});

// /auth/verify
router.post('/verify', async (req: Request, res: Response) => {
    const { phone, password, code } = req.body;

    try {
        await verifyTelegramOtp(phone, code, password);
        res.status(200).send({ message: 'Session verified and saved.' });
    } catch (error) {
        console.error('Error verifying Telegram OTP:', error);
        res.status(500).send({ error: 'Failed to verify OTP.' });
    }
});

// /auth/session-status
// router.get('/session-status', async (req: Request, res: Response) => {
//     const { userId, phoneNumber } = req.query;

//     try {
//         const client = await loadSession(userId as string, phoneNumber as string);
//         if (client && await isSessionValid(client)) {
//             res.status(200).send({ valid: true });
//         } else {
//             res.status(200).send({ valid: false });
//         }
//     } catch (error) {
//         console.error('Error checking session status:', error);
//         res.status(500).send({ error: 'Failed to check session status.' });
//     }
// });

// /auth/remove-session
router.post('/remove-session', async (req: Request, res: Response) => {
    const { userId, phoneNumber } = req.body;

    try {
        removeSession(phoneNumber);
        res.status(200).send({ message: 'Session removed.' });
    } catch (error) {
        console.error('Error removing session:', error);
        res.status(500).send({ error: 'Failed to remove session.' });
    }
});


// /auth/sessions
router.get('/sessions', async (req: Request, res: Response) => {
    try {
        const sessions = await prisma.session.findMany();

    if (sessions.length === 0) {
      console.warn('No sessions found in the database. Skipping initialization.');
      res.status(404).send({msg: "no sessions"});
      return
    }   

        res.status(200).send(sessions);
    } catch (error) {
        console.error('Error retrieving sessions:', error);
        res.status(500).send({ error: 'Failed to retrieve sessions.' });
    }
});

export default router;
