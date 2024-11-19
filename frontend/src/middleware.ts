import { NextRequest, NextResponse } from 'next/server';
import ky from 'ky';

// Types
interface TokenVerificationResponse {
  valid: boolean;
}

interface RefreshTokenResponse {
  accessToken: string;
}

// Utility function to validate a token
const checkToken = async (token: string | undefined): Promise<boolean | 'backend-unreachable'> => {
  if (!token) return false;

  try {
    const response = await ky
      .get('http://localhost:3001/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .json<TokenVerificationResponse>();
    return response.valid;
  } catch (error) {
    console.error('Error verifying token:', error);
    return 'backend-unreachable';
  }
};

// Utility function to refresh an access token
const refreshAccessToken = async (refreshToken: string | undefined): Promise<string | 'backend-unreachable' | null> => {
  if (!refreshToken) return null;

  try {
    const response = await ky
      .post('http://localhost:3001/api/auth/refresh', {
        json: { refreshToken },
      })
      .json<RefreshTokenResponse>();
    return response.accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return 'backend-unreachable';
  }
};

// Main middleware function
export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get('access-token')?.value;
  const refreshToken = req.cookies.get('refresh-token')?.value;
  const currentPath = req.nextUrl.pathname;

  // Define public paths that don't require authentication
  const publicPaths = ['/'];
  const isPublicPath = publicPaths.includes(currentPath);

  // Validate token
  const tokenStatus = await checkToken(accessToken);

  if (tokenStatus === 'backend-unreachable') {
    console.warn('Backend is unreachable. Redirecting to "/" route.');
    if (!isPublicPath) {
      const response = NextResponse.redirect(new URL('/', req.url));
      // response.cookies.delete('access-token');
      // response.cookies.delete('refresh-token');
      return response;
    }
    return NextResponse.next();
  }

  // Handle invalid tokens for protected routes
  if (tokenStatus === false && refreshToken) {
    const newAccessToken = await refreshAccessToken(refreshToken);

    if (newAccessToken === 'backend-unreachable') {
      console.warn('Backend is unreachable during token refresh. Redirecting to "/" route.');
      if (!isPublicPath) {
        const response = NextResponse.redirect(new URL('/', req.url));
        response.cookies.delete('access-token');
        response.cookies.delete('refresh-token');
        return response;
      }
      return NextResponse.next();
    }

    if (newAccessToken) {
      // Set the new access token in cookies
      const response = NextResponse.next();
      response.cookies.set('access-token', newAccessToken, {
        httpOnly: true,
        secure: true,
      });
      return response;
    }

    // If refresh fails, redirect to login
    if (!isPublicPath) {
      const response = NextResponse.redirect(new URL('/', req.url));
      response.cookies.delete('access-token');
      response.cookies.delete('refresh-token');
      return response;
    }
    return NextResponse.next();
  }

  // Redirect authenticated users from "/" to "/app"
  if (tokenStatus === true && currentPath === '/') {
    return NextResponse.redirect(new URL('/app', req.url));
  }

  // Redirect unauthenticated users from protected routes to "/"
  if (tokenStatus === false && !isPublicPath) {
    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.delete('access-token');
    response.cookies.delete('refresh-token');
    return response;
  }

  // Default behavior: proceed with the request
  return NextResponse.next();
}

// Configuration for middleware matcher
export const config = {
  matcher: ['/', '/app/:path*'], // Specify routes to apply middleware
};
