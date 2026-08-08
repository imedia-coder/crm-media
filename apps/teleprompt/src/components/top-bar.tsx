import Link from "next/link";

export function TopBar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-5 py-4 backdrop-blur">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          T
        </span>
        <span className="text-lg font-semibold tracking-tight">
          TelePrompt
        </span>
      </Link>
      <div className="flex items-center gap-3">{right}</div>
    </header>
  );
}
