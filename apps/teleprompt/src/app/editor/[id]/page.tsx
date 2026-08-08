"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getScript, saveScript, saveVersion } from "@/lib/storage";
import { Script, ScriptVersion, WPM_OPTIONS } from "@/lib/types";
import { countWords, estimateDurationSeconds, formatDuration } from "@/lib/duration";
import { debounce } from "@/lib/debounce";
import { ChevronLeftIcon, HistoryIcon, PlayIcon } from "@/components/icons";
import { VersionHistoryPanel } from "@/components/version-history-panel";

const VERSION_SNAPSHOT_INTERVAL_MS = 120_000;

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [script, setScript] = useState<Script | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const loadedRef = useRef(false);
  const scriptRef = useRef<Script | null>(null);
  const lastSnapshotRef = useRef("");

  useEffect(() => {
    getScript(id).then((s) => {
      if (!s) {
        setNotFound(true);
        return;
      }
      setScript(s);
      setSavedAt(s.updatedAt);
      lastSnapshotRef.current = s.content;
      loadedRef.current = true;
    });
  }, [id]);

  useEffect(() => {
    scriptRef.current = script;
  }, [script]);

  // Periodic version checkpoints (§44) — independent of the autosave debounce
  // so continuous typing doesn't keep resetting the timer; reads the latest
  // script via a ref instead of depending on it directly.
  useEffect(() => {
    async function snapshotIfChanged() {
      const current = scriptRef.current;
      if (!current || current.content.trim() === "" || current.content === lastSnapshotRef.current) {
        return;
      }
      await saveVersion({ id: current.id, title: current.title, content: current.content });
      lastSnapshotRef.current = current.content;
    }
    const interval = setInterval(snapshotIfChanged, VERSION_SNAPSHOT_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      snapshotIfChanged();
    };
  }, []);

  const debouncedSave = useMemo(
    () =>
      debounce(async (next: Script) => {
        setSaving(true);
        await saveScript(next);
        setSaving(false);
        setSavedAt(Date.now());
      }, 600),
    [],
  );

  const update = useCallback(
    (patch: Partial<Script>) => {
      setScript((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        if (loadedRef.current) debouncedSave(next);
        return next;
      });
    },
    [debouncedSave],
  );

  const handleRestore = useCallback(
    async (version: ScriptVersion) => {
      const current = scriptRef.current;
      if (!current) return;
      if (current.content !== lastSnapshotRef.current) {
        await saveVersion({ id: current.id, title: current.title, content: current.content });
      }
      const restored = { ...current, title: version.title, content: version.content };
      setScript(restored);
      lastSnapshotRef.current = version.content;
      await saveScript(restored);
      setSavedAt(Date.now());
      setShowHistory(false);
    },
    [],
  );

  if (notFound) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Script introuvable.</p>
        <Link href="/" className="text-primary hover:underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Chargement…
      </div>
    );
  }

  const words = countWords(script.content);
  const duration = estimateDurationSeconds(script.content, script.wordsPerMinute);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Link
          href="/"
          className="flex items-center gap-1 rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <span className="text-sm text-muted-foreground">
          {saving ? "Sauvegarde…" : savedAt ? "Sauvegardé automatiquement" : ""}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(true)}
            aria-label="Historique des versions"
            title="Historique des versions"
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <HistoryIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => router.push(`/prompter/${script.id}`)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            <PlayIcon className="h-4 w-4" />
            Lancer
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-6">
        <input
          value={script.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Titre"
          className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground"
        />

        <textarea
          value={script.content}
          onChange={(e) => update({ content: e.target.value })}
          placeholder="Bonjour et bienvenue…"
          className="mt-4 min-h-[50vh] flex-1 resize-none bg-transparent text-lg leading-relaxed outline-none placeholder:text-muted-foreground"
        />

        <div className="sticky bottom-0 mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border bg-background/90 py-3 text-sm text-muted-foreground backdrop-blur">
          <span>{words} mots</span>
          <span>{formatDuration(duration)}</span>
          <label className="ml-auto flex items-center gap-2">
            Vitesse de lecture
            <select
              value={script.wordsPerMinute}
              onChange={(e) => update({ wordsPerMinute: Number(e.target.value) })}
              className="rounded-md border border-border bg-card px-2 py-1 text-foreground"
            >
              {WPM_OPTIONS.map((wpm) => (
                <option key={wpm} value={wpm}>
                  {wpm} mots/min
                </option>
              ))}
            </select>
          </label>
        </div>
      </main>

      {showHistory && (
        <VersionHistoryPanel
          scriptId={script.id}
          onClose={() => setShowHistory(false)}
          onRestore={handleRestore}
        />
      )}
    </div>
  );
}
