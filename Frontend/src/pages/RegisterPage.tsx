import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import Logo from '../components/Logo';
import Button from '../components/Button';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      const fields = getFieldErrors(err);
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const renderFieldError = (name: string) =>
    fieldErrors[name]?.map((msg) => (
      <p key={msg} role="alert" className="text-buoy text-xs mt-1">
        {msg}
      </p>
    ));

  return (
    <div className="min-h-svh flex flex-col justify-center items-center px-4 py-12 bg-mist">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg" data-ui="register-card">
        <div className="flex justify-center mb-6">
          <Link to="/">
            <Logo size="md" />
          </Link>
        </div>

        <h1 className="text-2xl font-bold font-display text-tide mb-2 text-center">
          Create an account
        </h1>
        <p className="text-slate text-sm text-center mb-6">
          Join TrueHarbor for secure ordering and tracking
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-buoy-tint rounded-md text-buoy text-sm"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" data-ui="register-form">
          <div>
            <label className="block text-sm font-medium text-tide mb-1">
              Full name
            </label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full h-[44px] px-3 bg-white border border-edge rounded-md text-tide text-sm focus:outline-none focus:ring-2 focus:ring-harbor focus:border-harbor transition-colors"
              placeholder="Jane Doe"
            />
            {renderFieldError('name')}
          </div>

          <div>
            <label className="block text-sm font-medium text-tide mb-1">
              Email address
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full h-[44px] px-3 bg-white border border-edge rounded-md text-tide text-sm focus:outline-none focus:ring-2 focus:ring-harbor focus:border-harbor transition-colors"
              placeholder="jane@example.com"
            />
            {renderFieldError('email')}
          </div>

          <div>
            <label className="block text-sm font-medium text-tide mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full h-[44px] px-3 bg-white border border-edge rounded-md text-tide text-sm focus:outline-none focus:ring-2 focus:ring-harbor focus:border-harbor transition-colors"
              placeholder="Minimum 8 characters"
            />
            {renderFieldError('password')}
          </div>

          <div>
            <label className="block text-sm font-medium text-tide mb-1">
              Confirm password
            </label>
            <input
              name="password_confirmation"
              type="password"
              value={form.password_confirmation}
              onChange={handleChange}
              required
              className="w-full h-[44px] px-3 bg-white border border-edge rounded-md text-tide text-sm focus:outline-none focus:ring-2 focus:ring-harbor focus:border-harbor transition-colors"
              placeholder="Repeat password"
            />
            {renderFieldError('password_confirmation')}
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
            className="w-full mt-2"
          >
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate">
          Already have an account?{' '}
          <Link to="/login" className="text-harbor font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}