import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { ACADEMIC_START_DATE, isBeforeAcademicStart, toLocalDateInput } from '../lib/date';
import { SectionCard } from '../components/SectionCard';
import { CalendarGrid } from '../components/CalendarGrid';
import { Modal } from '../components/Modal';
import { AttendanceChecklist } from '../components/AttendanceChecklist';

function buildMonthCells(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = firstDay.getDay();
  const cells = [];
  const cursor = new Date(year, monthIndex, 1 - startOffset);

  for (let index = 0; index < 42; index += 1) {
    const dateKey = toLocalDateInput(cursor);
    const dayOfWeek = cursor.getDay();
    cells.push({
      key: dateKey,
      dateKey,
      dayNumber: cursor.getDate(),
      inMonth: cursor.getMonth() === monthIndex,
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isBeforeAcademicStart: isBeforeAcademicStart(dateKey)
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return cells;
}

export function CalendarPage() {
  const now = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [holidays, setHolidays] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [dayData, setDayData] = useState(null);
  const [open, setOpen] = useState(false);
  const [saveError, setSaveError] = useState('');

  async function load() {
    const response = await api.get('/holidays');
    const specific = Object.fromEntries(response.data.holidays.map((holiday) => [holiday.date, holiday]));
    setHolidays(specific);
  }

  useEffect(() => {
    load();
  }, []);

  const cells = buildMonthCells(currentYear, currentMonth);
  const today = toLocalDateInput(now);

  function shiftMonth(delta) {
    setCurrentMonth((value) => {
      const next = value + delta;
      if (next < 0) {
        setCurrentYear((year) => year - 1);
        return 11;
      }
      if (next > 11) {
        setCurrentYear((year) => year + 1);
        return 0;
      }
      return next;
    });
  }

  async function openDate(dateKey) {
    const response = await api.get('/attendance/day', { params: { date: dateKey } });
    setSelectedDate(dateKey);
    setDayData(response.data);
    setOpen(true);
  }

  async function saveDay() {
    setSaveError('');
    try {
      await api.put('/attendance/day', {
        date: selectedDate,
        periods: dayData.periods
      });
      setOpen(false);
    } catch (error) {
      setSaveError(error.response?.data?.message || 'Unable to save this day right now.');
    }
  }

  function setPeriodAttendance(periodNumber, attended) {
    setDayData((current) => ({
      ...current,
      periods: current.periods.map((period) => (
        period.periodNumber === periodNumber ? { ...period, attended } : period
      ))
    }));
  }

  function handleMarkAll(attended) {
    setDayData((current) => ({
      ...current,
      periods: (current?.periods || []).map((period) => ({
        ...period,
        attended
      }))
    }));
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Academic Calendar"
        subtitle="Current month with holidays disabled and quick attendance entry on working days."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentMonth(now.getMonth());
                setCurrentYear(now.getFullYear());
              }}
              className="rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-200"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Next
            </button>
          </div>
        }
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="display-font text-2xl font-bold text-slate-950">
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(currentYear, currentMonth, 1))}
          </h3>
          <p className="text-sm text-slate-500">Disabled dates are holidays and cannot be opened.</p>
        </div>
        <CalendarGrid monthCells={cells} onSelectDate={openDate} holidays={holidays} today={today} />
        <p className="mt-4 text-sm text-slate-500">Dates before {ACADEMIC_START_DATE} are disabled because college starts on June 15.</p>
      </SectionCard>

      <Modal
        open={open}
        title={selectedDate}
        onClose={() => setOpen(false)}
      >
        {dayData?.isHoliday ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700">
            {dayData.holiday?.holidayName || 'Holiday'} is locked and does not allow attendance entry.
          </div>
        ) : (
          <div className="space-y-4">
            {dayData?.periods?.length ? (
              <div className="flex items-center justify-end gap-4 border-b border-slate-100 pb-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleMarkAll(true)}
                  className="text-emerald-600 transition-colors hover:text-emerald-700 hover:underline"
                  aria-label="Mark all periods present"
                >
                  ✓ Mark All Present
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleMarkAll(false)}
                  className="text-rose-600 transition-colors hover:text-rose-700 hover:underline"
                  aria-label="Clear all periods absent"
                >
                  ✗ Clear All (Absent)
                </button>
              </div>
            ) : null}
            <AttendanceChecklist periods={dayData?.periods || []} onToggle={setPeriodAttendance} />
            {saveError ? <p className="text-sm font-medium text-rose-600">{saveError}</p> : null}
            <button
              type="button"
              onClick={saveDay}
              className="inline-flex rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Save Day Attendance
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
