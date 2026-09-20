import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // Changed state defaults to completely empty strings
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(form);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 shadow-soft lg:grid-cols-[1.15fr_0.85fr]">
        <div className="bg-slate-950 p-8 text-white sm:p-10">
          <p className="display-font text-xs uppercase tracking-[0.32em] text-emerald-300">Engineering Attendance Tracker</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">Keep attendance predictable, visible, and under control.</h1>
          <p className="mt-5 max-w-xl text-slate-300">
            Track daily periods, block holiday dates, inspect analytics, and get a bunk meter that reacts to your current standing.
          </p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            Please enter your system credentials to access your dashboard.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-10">
          <div className="mb-8">
            <h2 className="display-font text-3xl font-bold text-slate-950">Student Login</h2>
            <p className="mt-2 text-sm text-slate-500">Secure access to your attendance dashboard.</p>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Username</span>
            <input
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 focus:border-emerald-400"
              placeholder="Enter username"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 focus:border-emerald-400"
              placeholder="Enter password"
            />
          </label>

          {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            Need an account?{' '}
            <Link to="/signup" className="font-semibold text-emerald-700 hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}