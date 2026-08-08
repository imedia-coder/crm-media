"use client";

export function FinishScreen({
  videoUrl,
  onRestart,
  onDelete,
  onDone,
}: {
  videoUrl: string;
  onRestart: () => void;
  onDelete: () => void;
  onDone: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-black/90 p-6">
      <p className="text-lg font-medium text-white">Enregistrement terminé</p>
      <video src={videoUrl} controls playsInline className="max-h-[50vh] max-w-full rounded-lg" />
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={onDone}
          className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Enregistrer dans ma bibliothèque
        </button>
        <button
          onClick={onRestart}
          className="rounded-lg border border-border px-5 py-2.5 font-medium text-white hover:bg-white/10"
        >
          Recommencer
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg border border-destructive px-5 py-2.5 font-medium text-destructive hover:bg-destructive/10"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
