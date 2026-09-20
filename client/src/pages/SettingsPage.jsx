import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SectionCard } from '../components/SectionCard';
import { useAuth } from '../context/AuthContext';

export function SettingsPage() {
  const { user, updateTargetPercentage } = useAuth();
  const [holiday, setHoliday] = useState({ date: '', holidayName: '' });
  const [targetPercentage, setTargetPercentage] = useState('75');
  const [status, setStatus] = useState('');
  const [holidays, setHolidays] = useState([]);

  async function load() {
    const response = await api.get('/holidays');
    setHolidays(response.data.holidays);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setTargetPercentage(String(user?.targetPercentage ?? 75));
  }, [user?.targetPercentage]);

  async function handleTargetSubmit(event) {
    event.preventDefault();
    setStatus('Saving target attendance...');

    try {
      await updateTargetPercentage(Number(targetPercentage));
      setStatus('Target attendance updated successfully.');
    } catch (error) {
      setStatus(error.response?.data?.message || 'Unable to update target attendance.');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('Saving holiday...');
    try {
      await api.post('/holidays', holiday);
      setHoliday({ date: '', holidayName: '' });
      setStatus('Holiday saved and calendar updated.');
      await load();
    } catch (error) {
      setStatus(error.response?.data?.message || 'Unable to save holiday.');
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Target Attendance" subtitle="Update your goal anytime after login. The dashboard and bunk meter use this value immediately.">
        <form onSubmit={handleTargetSubmit} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Target Percentage</span>
            <input
              type="number"
              min="1"
              max="100"
              value={targetPercentage}
              onChange={(event) => setTargetPercentage(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
            />
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Update Target
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Settings" subtitle="Add custom holidays that immediately disable calendar dates.">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Date</span>
            <input
              type="date"
              value={holiday.date}
              onChange={(event) => setHoliday((current) => ({ ...current, date: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Holiday Name</span>
            <input
              value={holiday.holidayName}
              onChange={(event) => setHoliday((current) => ({ ...current, holidayName: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3"
              placeholder="College Day Off"
            />
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Add Holiday
          </button>
        </form>

        {status ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{status}</p> : null}
      </SectionCard>

      <SectionCard title="Holiday Registry" subtitle="Official and custom dates currently loaded in the system.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {holidays.map((entry) => (
            <div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{entry.holidayName}</p>
              <p className="mt-1 text-sm text-slate-500">{entry.date}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{entry.isOfficial ? 'Official' : 'Custom'}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
