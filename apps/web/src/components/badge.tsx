const COLORS: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  DECLINED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-red-100 text-red-700',
  OVERDUE: 'bg-amber-100 text-amber-700',
  PLANNED: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-muted text-muted-foreground',
  TODO: 'bg-muted text-muted-foreground',
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
