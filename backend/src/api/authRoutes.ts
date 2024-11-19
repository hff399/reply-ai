import { Router, Request, Response } from 'express';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, refreshAccessToken, verifyRefreshToken } from '../services/authService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt"

const router: Router = Router();

const users = [
  {id: 1, username: "admin", password: "example123"}
]

const prisma = new PrismaClient()

// Simulate login (replace with real authentication)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Fetch user from the database by email
    const user = await prisma.user.findUnique({
      where: { name: username },
    });

    // If no user is found, return 401
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return 
    }

    // Compare provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return 
    }

    // Generate access and refresh tokens
    const accessToken = await generateAccessToken({ id: user.id, username: user.name });
    const refreshToken = await generateRefreshToken({ id: user.id, username: user.name });

    // Send tokens in the response
    res.status(200).json({ accessToken, refreshToken });
    return
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Protected route to validate the token
router.get('/validate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ valid: true, user: req.user });
});


// Backend route to handle refresh token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ message: 'Refresh token is required' });
    return
  }

  try {
    const user = await verifyRefreshToken(refreshToken);  // Verify the refresh token
    const newAccessToken = await generateAccessToken({ id: user.id, username: user.username });

    // Generate a new refresh token
    const newRefreshToken = await generateRefreshToken({ id: user.id, username: user.username });

    // Send back both the new access token and the new refresh token
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

export default router;
