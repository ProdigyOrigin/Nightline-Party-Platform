'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { authenticateUser } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authenticateUser(username, password);
      
      if (!user) {
        setError('Invalid username or password');
        return;
      }

      // Store user info in localStorage for client-side access
      localStorage.setItem('nightline_user', JSON.stringify(user));
      
      // Refresh auth context
      await refreshUser();
      
      // Redirect to intended page or home
      const redirect = searchParams.get('redirect');
      router.push(redirect || '/');
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="card-neon">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-neon mb-2">
              Welcome Back
            </h1>
            <p className="text-secondary">
              Sign in to your Nightline account
            </p>
            {searchParams.get('message') && (
              <div className="mt-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-400 text-sm">
                {searchParams.get('message')}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-secondary">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary-neon hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          {/* Demo accounts info */}
          <div className="mt-8 p-4 bg-secondary rounded-lg">
            <p className="text-xs text-secondary mb-2">Demo Accounts:</p>
            <div className="text-xs text-secondary space-y-1">
              <div>Owner: owner / owner123</div>
              <div>Admin: admin / admin123</div>
              <div>Promoter: promoter1 / admin123</div>
              <div>User: user1 / admin123</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
