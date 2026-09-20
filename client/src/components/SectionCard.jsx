export function SectionCard({ title, subtitle, action, children }) {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/85 p-5 shadow-soft">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="display-font text-2xl font-bold text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
