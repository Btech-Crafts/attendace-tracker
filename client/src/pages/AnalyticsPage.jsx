import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SectionCard } from '../components/SectionCard';

function percentage(value) {
  // Safe layer: return 0.0% if the database returns null or undefined analytics
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }
  return `${Number(value).toFixed(1)}%`;
}

export function AnalyticsPage() {
  const [data, setData] = useState(null);

  async function load() {
    try {
      const response = await api.get('/attendance/analytics');
      setData(response.data);
    } catch (err) {
      console.error("Error loading analytics data:", err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!data) {
    return <div className="rounded-3xl bg-white/80 p-6 shadow-soft">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/60 bg-slate-950 p-6 text-white shadow-soft sm:p-8">
        <p className="display-font text-xs uppercase tracking-[0.3em] text-emerald-300">Analytics</p>
        <h1 className="display-font mt-3 text-4xl font-bold">Deep Performance Breakdown</h1>
        <p className="mt-2 max-w-2xl text-slate-300">Detailed overview of subject performance, historical trends, and targeted metrics tracking.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Overall Attendance</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{percentage(data.summary?.percentage ?? 0)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Total Hours Conducted</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{data.summary?.totalPeriods ?? 0} hrs</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-medium text-slate-500">Total Hours Attended</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{data.summary?.attendedPeriods ?? 0} hrs</p>
        </div>
      </div>

      <SectionCard title="Detailed Component Breakdown" subtitle="Performance analysis tracked down to single timetable periods.">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-soft">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Period / Slot</th>
                <th className="px-6 py-4">Status Balance</th>
                <th className="px-6 py-4">Success Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
              {(data.breakdown || []).length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                    No analytics data generated yet. Start tracking daily logs to build performance matrices.
                  </td>
                </tr>
              ) : (
                data.breakdown.map((row, idx) => {
                  const itemPercentage = row?.percentage ?? 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">{row.subjectName}</td>
                      <td className="whitespace-nowrap px-6 py-4">Period {row.periodNumber}</td>
                      <td className="whitespace-nowrap px-6 py-4">{row.attended ?? 0} / {row.total ?? 0} attended</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${itemPercentage >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {percentage(itemPercentage)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}