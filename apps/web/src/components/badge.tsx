const COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  PAID: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-red-100 text-red-700',
  OVERDUE: 'bg-amber-100 text-amber-700',
  PLANNED: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  DONE: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-slate-100 text-slate-500',
  TODO: 'bg-slate-100 text-slate-700',
  IN_REVIEW: 'bg-amber-100 text-amber-700',
};

export function Badge({ value }: { value: string }) {
  const classes = COLORS[value] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}
