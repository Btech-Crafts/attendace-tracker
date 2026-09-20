export function AttendanceChecklist({ periods, onToggle }) {
  return (
    <div className="space-y-3">
      {periods.map((period) => (
        <label
          key={period.periodNumber}
          className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
        >
          <div>
            <p className="font-semibold text-slate-950">Period {period.periodNumber}</p>
            <p className="text-sm text-slate-500">{period.subjectName}</p>
          </div>
          <input
            type="checkbox"
            checked={Boolean(period.attended)}
            onChange={(event) => onToggle(period.periodNumber, event.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
            aria-label={`Toggle attendance for Period ${period.periodNumber}`}
          />
        </label>
      ))}
    </div>
  );
}

