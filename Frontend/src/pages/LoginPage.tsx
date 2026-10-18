import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../utils/errors';
import Logo from '../components/Logo';
import Button from '../components/Button';

export default function LoginPage() {
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-svh flex flex-col justify-center items-center px-4 py-12 bg-mist">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg" data-ui="login-card">
        <div className="flex justify-center mb-6">
          <Link to="/">
            <Logo size="md" />
          </Link>
        </div>

        <h1 className="text-2xl font-bold font-display text-tide mb-2 text-center">
          Sign in to your account
        </h1>
        <p className="text-slate text-sm text-center mb-6">
          Access your orders and persistent cart
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-buoy-tint rounded-md text-buoy text-sm"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" data-ui="login-form">
          <div>
            <label className="block text-sm font-medium text-tide mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-[44px] px-3 bg-white border border-edge rounded-md text-tide text-sm focus:outline-none focus:ring-2 focus:ring-harbor focus:border-harbor transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-tide mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-[44px] px-3 bg-white border border-edge rounded-md text-tide text-sm focus:outline-none focus:ring-2 focus:ring-harbor focus:border-harbor transition-colors"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
            className="w-full mt-2"
          >
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate">
          Don't have an account?{' '}
          <Link to="/register" className="text-harbor font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}