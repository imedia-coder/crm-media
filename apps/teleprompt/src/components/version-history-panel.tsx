"use client";

import { useEffect, useState } from "react";
import { listVersions } from "@/lib/storage";
import { ScriptVersion } from "@/lib/types";
import { countWords } from "@/lib/duration";

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VersionHistoryPanel({
  scriptId,
  onClose,
  onRestore,
}: {
  scriptId: string;
  onClose: () => void;
  onRestore: (version: ScriptVersion) => void;
}) {
  const [versions, setVersions] = useState<ScriptVersion[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    listVersions(scriptId).then(setVersions);
  }, [scriptId]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar flex h-full w-full max-w-sm flex-col gap-4 overflow-y-auto bg-card p-5 text-card-foreground"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Historique des versions</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary"
          >
            Fermer
          </button>
        </div>

        {versions === null && (
          <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
        )}

        {versions?.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucune version enregistrée pour l&apos;instant. Une version est créée
            automatiquement pendant l&apos;écriture.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {versions?.map((version, index) => {
            const expanded = expandedId === version.id;
            return (
              <div key={version.id} className="rounded-lg border border-border p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">
                    {index === 0 ? "Version la plus récente" : formatTimestamp(version.createdAt)}
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {countWords(version.content)} mots
                  </span>
                </div>
                {index === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(version.createdAt)}
                  </p>
                )}
                <p
                  className={`mt-2 whitespace-pre-line text-sm text-muted-foreground ${
                    expanded ? "" : "line-clamp-2"
                  }`}
                >
                  {version.content || "(vide)"}
                </p>
                <div className="mt-2 flex gap-3 text-sm">
                  <button
                    onClick={() => setExpandedId(expanded ? null : version.id)}
                    className="font-medium text-muted-foreground hover:text-foreground"
                  >
                    {expanded ? "Réduire" : "Aperçu"}
                  </button>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Restaurer cette version ? Le contenu actuel sera d'abord sauvegardé dans l'historique.",
                        )
                      ) {
                        onRestore(version);
                      }
                    }}
                    className="font-medium text-primary hover:underline"
                  >
                    Restaurer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
