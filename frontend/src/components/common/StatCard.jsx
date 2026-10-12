import React from 'react';

export function StatCard({ title, value, subtitle, icon: Icon, color = 'teal', trend, badge }) {
  const colorStyles = {
    teal: 'bg-teal-50 text-cc-dark border-teal-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-cc-surface bg-white shadow-soft relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 h-full flex flex-col justify-between min-w-0">
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-cc-muted truncate" title={title}>{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-cc-navy mt-1 tracking-tight truncate">{value}</h3>
          {subtitle && <p className="text-xs text-cc-slate mt-1 line-clamp-2 leading-relaxed">{subtitle}</p>}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl border ${colorStyles[color]} shrink-0 shadow-xs flex items-center justify-center`}>
            <Icon className="w-5 h-5 shrink-0" />
          </div>
        )}
      </div>

      {(trend || badge) && (
        <div className="mt-4 pt-3 border-t border-cc-surface/80 flex items-center justify-between text-xs gap-2 min-w-0">
          {trend && <span className="text-cc-slate font-medium truncate">{trend}</span>}
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
      )}
    </div>
  );
}
