import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { toLocalDateInput } from '../lib/date';
import { SectionCard } from '../components/SectionCard';
import { StatCard } from '../components/StatCard';
import { AttendanceChecklist } from '../components/AttendanceChecklist';

function percentage(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }
  return `${Number(value).toFixed(1)}%`;
}

export function DashboardPage() {
  const today = useMemo(() => toLocalDateInput(new Date()), []);
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  async function load() {
    try {
      const response = await api.get('/attendance/dashboard', { params: { date: today } });
      setData(response.data);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  }

  useEffect(() => {
    load();
  }, [today]);

  async function persistPeriods(nextPeriods) {
    setSaving(true);
    setSaveError('');
    try {
      await api.put('/attendance/day', {
        date: today,
        periods: nextPeriods
      });
      await load();
    } catch (error) {
      setSaveError(error.response?.data?.message || 'Unable to save attendance right now.');
      await load();
    } finally {
      setSaving(false);
    }
  }

  // Helper handler to check/uncheck all periods instantly
  function handleMarkAll(status) {
    const todaySchedule = data?.todaySchedule || [];
    if (todaySchedule.length === 0) return;

    const nextPeriods = todaySchedule.map((period) => ({
      ...period,
      attended: status
    }));

    // Update frontend state immediately for snappy UI feel
    setData((current) => ({ ...current, todaySchedule: nextPeriods }));
    // Persist bulk changes to database
    persistPeriods(nextPeriods);
  }

  if (!data) {
    return <div className="rounded-3xl bg-white/80 p-6 shadow-soft">Loading dashboard...</div>;
  }

  const todaySchedule = data.todaySchedule || [];

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/60 bg-slate-950 p-6 text-white shadow-soft sm:p-8">
        <p className="display-font text-xs uppercase tracking-[0.3em] text-emerald-300">Today</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="display-font text-4xl font-bold">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-slate-300">Quick schedule, total performance, subject pressure points, bunk guidance, and the next holiday in one place.</p>
          </div>
          {data.nextHoliday ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Next holiday</p>
              <p className="mt-1 text-xl font-semibold text-white">{data.nextHoliday.holidayName}</p>
              <p className="text-sm text-slate-300">{data.nextHoliday.date}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard 
          label="Overall attendance" 
          value={percentage(data.summary?.percentage ?? 0)} 
          detail={`Target ${data.summary?.targetPercentage || 75}%`} 
          accent="emerald" 
        />
        <StatCard 
          label="Attended periods" 
          value={data.summary?.attendedPeriods ?? 0} 
          detail={`Total conducted ${data.summary?.totalPeriods ?? 0}`} 
          accent="sky" 
        />
        <StatCard 
          label="Bunk meter" 
          value={data.bunkMeter?.value ?? 0} 
          detail={data.bunkMeter?.message || 'No calculation metrics available.'} 
          accent={data.bunkMeter?.mode === 'safe-skips' ? 'amber' : 'rose'} 
        />
        <StatCard 
          label="Next holiday" 
          value={data.nextHoliday ? data.nextHoliday.date : 'None'} 
          detail={data.nextHoliday ? data.nextHoliday.holidayName : 'No upcoming holiday found'} 
          accent="rose" 
        />
      </div>

      <SectionCard title="Today's Quick Schedule" subtitle="Toggle attendance directly from the dashboard.">
        <div className="space-y-4">
          
          {/* Action Header bar for Bulk Selection */}
          {todaySchedule.length > 0 && (
            <div className="flex items-center justify-end gap-4 border-b border-slate-100 pb-2 text-xs font-semibold">
              <button 
                onClick={() => handleMarkAll(true)}
                className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                aria-label="Mark all periods present"
              >
                ✓ Mark All Present
              </button>
              <span className="text-slate-300">|</span>
              <button 
                onClick={() => handleMarkAll(false)}
                className="text-rose-600 hover:text-rose-700 hover:underline transition-colors"
                aria-label="Clear all periods absent"
              >
                ✗ Clear All (Absent)
              </button>
            </div>
          )}

          {todaySchedule.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No timetable entries for today.</p>
          ) : (
            <AttendanceChecklist
              periods={todaySchedule}
              onToggle={(periodNumber, attended) => {
                const nextPeriods = todaySchedule.map((period) => (
                  period.periodNumber === periodNumber ? { ...period, attended } : period
                ));
                setData((current) => ({ ...current, todaySchedule: nextPeriods }));
                persistPeriods(nextPeriods);
              }}
            />
          )}
          {saving ? <p className="text-sm font-medium text-emerald-600 animate-pulse">Saving attendance updates...</p> : null}
          {saveError ? <p className="text-sm font-medium text-rose-600">{saveError}</p> : null}
        </div>
      </SectionCard>

      <SectionCard title="Subject-wise Snapshot" subtitle="Subjects below 75% are highlighted in red.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data.subjectSnapshots || []).map((subject) => {
            const currentPercentage = subject?.percentage ?? 0;
            const isLow = currentPercentage < 75;
            
            return (
              <div key={subject.subjectName} className={`rounded-3xl border p-4 ${isLow ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold">{subject.subjectName}</p>
                  <span className="text-sm font-bold">{percentage(currentPercentage)}</span>
                </div>
                <p className="mt-2 text-sm">{subject.attended ?? 0}/{subject.total ?? 0} attended</p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Bunk Meter Logic" subtitle="The meter updates from current attendance and target percentage.">
        <p className="max-w-3xl text-sm leading-6 text-slate-600">{data.bunkMeter?.message || 'No calculation data available.'}</p>
      </SectionCard>
    </div>
  );
}