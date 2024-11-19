import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/authService';

// Extend the Request type to include user information
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

// Middleware to authenticate the JWT
const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: Token missing or invalid' });
    next()
    return
  }

  const token = authHeader.split(' ')[1]; // Extract the token

  try {
    const decoded = await verifyAccessToken(token); // Verify token using authService
    req.user = decoded as { id: number; username: string }; // Attach user info to the request
    next(); // Continue to the next handler
    return
  } catch (error) {
    res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
    return
  }
};

export { authenticateToken, AuthenticatedRequest };
