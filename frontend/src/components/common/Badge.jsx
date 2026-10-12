import React from 'react';

export function Badge({ type, label, size = 'sm' }) {
  let styles = 'bg-gray-100 text-gray-700 border-gray-200';

  switch (type) {
    case 'risk-high':
      styles = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      break;
    case 'risk-moderate':
      styles = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      break;
    case 'risk-low':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
      break;
    case 'attendance-warning':
      styles = 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
      break;
    case 'attendance-good':
      styles = 'bg-teal-50 text-teal-700 border-teal-200';
      break;
    case 'fee-paid':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'fee-overdue':
      styles = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'fee-partial':
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'active':
      styles = 'bg-teal-50 text-cc-dark border-teal-200';
      break;
    default:
      styles = 'bg-cc-surface text-cc-slate border-cc-hover';
  }

  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${sizeClass} ${styles} shadow-xs`}>
      {label}
    </span>
  );
}
