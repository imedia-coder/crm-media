"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/top-bar";
import {
  deleteRecording,
  getRecordingBlob,
  listRecordings,
  renameRecording,
} from "@/lib/storage";
import { Recording } from "@/lib/types";
import { formatDuration } from "@/lib/duration";
import { DownloadIcon, PlayIcon, TrashIcon, VideoIcon } from "@/components/icons";

export default function VideosPage() {
  const [recordings, setRecordings] = useState<Recording[] | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState("");

  useEffect(() => {
    listRecordings().then(setRecordings);
  }, []);

  async function handlePlay(recording: Recording) {
    const blob = await getRecordingBlob(recording.id);
    if (!blob) return;
    setPlayingUrl(URL.createObjectURL(blob));
    setPlayingTitle(recording.title);
  }

  async function handleDownload(recording: Recording) {
    const blob = await getRecordingBlob(recording.id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = recording.mimeType.includes("mp4") ? "mp4" : "webm";
    a.download = `${recording.title || "video"}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRename(recording: Recording) {
    const title = prompt("Nouveau nom", recording.title);
    if (!title) return;
    await renameRecording(recording.id, title);
    setRecordings((prev) =>
      prev?.map((r) => (r.id === recording.id ? { ...r, title } : r)) ?? null,
    );
  }

  async function handleDelete(recording: Recording) {
    if (!confirm("Supprimer cette vidéo ?")) return;
    await deleteRecording(recording.id);
    setRecordings((prev) => prev?.filter((r) => r.id !== recording.id) ?? null);
  }

  function closePlayer() {
    if (playingUrl) URL.revokeObjectURL(playingUrl);
    setPlayingUrl(null);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Mes vidéos</h1>

        {recordings === null && (
          <p className="py-8 text-center text-sm text-muted-foreground">Chargement…</p>
        )}

        {recordings?.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-border py-12 text-center">
            <VideoIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Aucune vidéo enregistrée pour l&apos;instant.</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {recordings?.map((recording) => (
            <div
              key={recording.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4"
            >
              <button onClick={() => handlePlay(recording)} className="min-w-0 flex-1 text-left">
                <p className="truncate font-medium text-card-foreground">{recording.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDuration(recording.duration)} &middot; {recording.resolution} &middot;{" "}
                  {new Date(recording.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRename(recording)}
                  className="rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Renommer
                </button>
                <button
                  onClick={() => handleDownload(recording)}
                  aria-label="Télécharger"
                  className="rounded-lg p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <DownloadIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(recording)}
                  aria-label="Supprimer"
                  className="rounded-lg p-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePlay(recording)}
                  aria-label="Lire"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover"
                >
                  <PlayIcon className="ml-0.5 h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {playingUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closePlayer}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
            <p className="mb-2 text-sm text-white/80">{playingTitle}</p>
            <video src={playingUrl} controls autoPlay playsInline className="w-full rounded-lg" />
            <button
              onClick={closePlayer}
              className="mt-3 w-full rounded-lg border border-white/20 py-2 text-sm text-white hover:bg-white/10"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
