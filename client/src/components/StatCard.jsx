export function StatCard({ label, value, detail, accent = 'emerald' }) {
  const accentMap = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-700',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-700',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-700',
    sky: 'from-sky-500/20 to-sky-500/5 text-sky-700'
  };

  return (
    <div className={`rounded-3xl border border-white/60 bg-gradient-to-br p-5 shadow-soft ${accentMap[accent] || accentMap.emerald}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <div className="mt-3 text-3xl font-bold text-slate-950">{value}</div>
      {detail ? <p className="mt-2 text-sm text-slate-600">{detail}</p> : null}
    </div>
  );
}
