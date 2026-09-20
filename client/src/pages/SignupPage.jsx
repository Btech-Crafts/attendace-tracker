import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    targetPercentage: '75'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          targetPercentage: Number(form.targetPercentage)
        })
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const message = isJson ? data?.message : data;
        throw new Error(message || 'Signup failed');
      }

      // When JSON is expected, `data` should be an object.
      const token = isJson ? data?.token : null;
      if (!token) {
        throw new Error('Signup succeeded but no token was returned');
      }

      localStorage.setItem('attendance_token', token);
      await login({ username: form.username, password: form.password });
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 shadow-soft lg:grid-cols-[1.15fr_0.85fr]">
        <div className="bg-slate-950 p-8 text-white sm:p-10">
          <p className="display-font text-xs uppercase tracking-[0.32em] text-emerald-300">Engineering Attendance Tracker</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">Create your student account.</h1>
          <p className="mt-5 max-w-xl text-slate-300">
            Register with a username and password, then use the same credentials to log in securely.
          </p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            Your account stores only hashed passwords. You can set your target attendance here too.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-10">
          <div className="mb-8">
            <h2 className="display-font text-3xl font-bold text-slate-950">Student Sign Up</h2>
            <p className="mt-2 text-sm text-slate-500">Create credentials for login.</p>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Username</span>
            <input
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 focus:border-emerald-400"
              placeholder="your username"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 focus:border-emerald-400"
              placeholder="minimum 6 characters"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-700">Confirm Password</span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 focus:border-emerald-400"
              placeholder="re-enter password"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-700">Target Percentage</span>
            <input
              type="number"
              min="1"
              max="100"
              value={form.targetPercentage}
              onChange={(event) => setForm((current) => ({ ...current, targetPercentage: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 focus:border-emerald-400"
            />
          </label>

          {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-emerald-700 hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
