const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({ monthCells, onSelectDate, holidays, today }) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {monthCells.map((cell) => {
          const holiday = holidays[cell.dateKey];
          const isToday = cell.dateKey === today;
          const isHoliday = Boolean(holiday) || cell.isWeekend || cell.isBeforeAcademicStart;
          const holidayLabel = cell.isBeforeAcademicStart
            ? 'College Starts June 15'
            : holiday?.holidayName || (cell.dayOfWeek === 0 ? 'Sunday' : cell.dayOfWeek === 6 ? 'Saturday' : null);

          return (
            <button
              key={cell.key}
              type="button"
              disabled={!cell.inMonth || isHoliday}
              onClick={() => onSelectDate(cell.dateKey)}
              className={[
                'min-h-[96px] rounded-3xl border p-3 text-left transition',
                cell.inMonth ? 'bg-white' : 'bg-slate-50 text-slate-300',
                isHoliday ? 'cursor-not-allowed border-rose-200 bg-rose-50 text-rose-400' : 'border-slate-200 hover:border-emerald-300 hover:shadow-soft',
                isToday ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-50' : ''
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold">{cell.dayNumber}</span>
                {isHoliday ? (
                  <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600">
                    Holiday
                  </span>
                ) : null}
              </div>
              {holidayLabel ? <p className="mt-3 text-xs font-medium text-rose-600">{holidayLabel}</p> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}