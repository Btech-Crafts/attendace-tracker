import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' }
];

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen text-slate-900 lg:flex">
      <aside className="border-b border-white/50 bg-slate-950 px-6 py-6 text-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:border-slate-800">
        <div className="mb-10">
          <p className="display-font text-xs uppercase tracking-[0.3em] text-emerald-300">Attendance Tracker</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight">Engineering Student Hub</h1>
          <p className="mt-3 text-sm text-slate-300">Responsive control center for timetable, holidays, and attendance metrics.</p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => [
                'block rounded-2xl px-4 py-3 text-sm font-medium transition',
                isActive ? 'bg-white text-slate-950 shadow-soft' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              ].join(' ')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Logged in as</p>
          <p className="mt-2 text-lg font-semibold">{user?.username}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
