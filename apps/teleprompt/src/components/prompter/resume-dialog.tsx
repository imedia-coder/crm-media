"use client";

export function ResumeDialog({
  onResume,
  onRestart,
}: {
  onResume: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 text-center text-card-foreground">
        <p className="mb-5 text-lg font-medium">Reprendre votre dernière session ?</p>
        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 rounded-lg border border-border py-2.5 font-medium hover:bg-secondary"
          >
            Recommencer
          </button>
          <button
            onClick={onResume}
            className="flex-1 rounded-lg bg-primary py-2.5 font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Reprendre
          </button>
        </div>
      </div>
    </div>
  );
}
