import express from 'express';
import { setOtpCode, createTelegramClient, isSessionValid, globalClient } from '../services/telegramService';  // Assuming telegramService is your file
import { AuthenticatedRequest, authenticateToken } from '../middleware/authMiddleware'
import { Dialog } from 'telegram/tl/custom/dialog';

const router = express.Router();

// Route to start the authentication process
router.post('/auth/start', async (req, res) => {
  const { phone, password } = req.body;


  console.log(phone, password)
  try {
    createTelegramClient(phone, password);
    res.json({ message: 'OTP sent, waiting for code' });
  } catch (error) {
    console.error('Error starting authentication:', error);
    res.status(500).json({ message: 'Error during authentication start' });
  }
});

// Route to verify the OTP code
router.post('/auth/verify', (req, res) => {
  const { phone, code } = req.body;
  try {
    setOtpCode(code);  // This will resolve the OTP Promise
    res.json({ message: 'Verification successful, check if password is required' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Error during verification' });
  }
});


// Route to check if session exists and is valid
router.post('/auth/session-status', async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({ message: 'Phone number is required' });
      return
    }
  
    try {
      const sessionValid = await isSessionValid(phone as string);
      if (sessionValid) {
        res.json({ valid: true });
      } else {
        res.status(401).json({ message: 'Session is invalid or expired' });
      }
    } catch (error) {
      console.error('Error during session validation:', error);
      res.status(500).json({ message: 'Error checking session' });
    }
  });



export default router;
