"use client";

import Link from "next/link";
import { Script } from "@/lib/types";
import { countWords, estimateDurationSeconds, formatDuration } from "@/lib/duration";
import { PlayIcon, TrashIcon } from "./icons";

export function ScriptCard({
  script,
  onDelete,
}: {
  script: Script;
  onDelete: (id: string) => void;
}) {
  const words = countWords(script.content);
  const duration = estimateDurationSeconds(script.content, script.wordsPerMinute);

  return (
    <div className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition hover:border-primary/50">
      <Link href={`/editor/${script.id}`} className="min-w-0 flex-1">
        <p className="truncate font-medium text-card-foreground">
          {script.title || "Sans titre"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {words} mots &middot; {formatDuration(duration)}
        </p>
      </Link>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onDelete(script.id)}
          aria-label="Supprimer le script"
          className="rounded-lg p-2.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
        <Link
          href={`/prompter/${script.id}`}
          aria-label="Lancer le téléprompteur"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary-hover"
        >
          <PlayIcon className="ml-0.5 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
