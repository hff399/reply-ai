'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ky from 'ky';
import { toast } from 'sonner';

const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000); // Set expiration time
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`; // Store cookie
};

export const AuthForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      const response: { accessToken: string, refreshToken: string } = await ky
        .post('http://localhost:3001/api/auth/login', {
          json: { username, password },
        })
        .json();
  
      // Save token to cookie with an expiration date (e.g., 1 day)
      setCookie('access-token', response.accessToken, 1); // Cookie expires in 1 day
      setCookie('refresh-token', response.refreshToken, 1); // Cookie expires in 1 day
  
      // Redirect to dashboard or handle post-login behavior
      toast.success('Login successful!')
      window.location.href = '/app'; // Example redirect
    } catch (err: any) {
        toast.error(err.message || 'Failed to authenticate')
        setError(err.message || 'Failed to authenticate');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
