import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { JWT_SECRET } from '../server';

// Define the structure of your JWT payload
interface UserPayload extends JWTPayload {
  id: number;
  username: string;
}

// Secret keys (Use environment variables in production)
const ACCESS_TOKEN_SECRET = new TextEncoder().encode(JWT_SECRET);
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(JWT_SECRET);
const ACCESS_TOKEN_EXPIRATION = '15m'; // 15 minutes for access token
const REFRESH_TOKEN_EXPIRATION = '7d'; // 7 days for refresh token

// Generate an access token
const generateAccessToken = async (user: UserPayload) => {
  return new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' }) // Set the signing algorithm (HS256)
    .setIssuedAt() // Set the issued time
    .setExpirationTime(ACCESS_TOKEN_EXPIRATION) // Set the expiration time for access token
    .sign(ACCESS_TOKEN_SECRET); // Sign the JWT with the secret
};

// Generate a refresh token
const generateRefreshToken = async (user: UserPayload) => {
  return new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' }) // Set the signing algorithm
    .setIssuedAt() // Set the issued time
    .setExpirationTime(REFRESH_TOKEN_EXPIRATION) // Set the expiration time for refresh token
    .sign(REFRESH_TOKEN_SECRET); // Sign the JWT with the refresh token secret
};

// Verify access token
const verifyAccessToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
    return payload;
  } catch (err) {
    throw new Error('Invalid or expired access token');
  }
};

// Verify refresh token
const verifyRefreshToken = async (token: string): Promise<UserPayload> => {
  try {
    const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);
    return payload as UserPayload;
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }
};

// Refresh the access token using refresh token
const refreshAccessToken = async (refreshToken: string) => {
  const decoded = await verifyRefreshToken(refreshToken) as UserPayload;
  return generateAccessToken(decoded);
};



export { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, refreshAccessToken };
