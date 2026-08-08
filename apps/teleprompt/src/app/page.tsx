"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { ScriptCard } from "@/components/script-card";
import { createScript, deleteScript, listScripts, listRecordings } from "@/lib/storage";
import { Script, Recording } from "@/lib/types";
import { PlusIcon, VideoIcon, UploadIcon } from "@/components/icons";
import { extractDocument, IMPORT_ACCEPT } from "@/lib/import-document";

export default function DashboardPage() {
  const router = useRouter();
  const [scripts, setScripts] = useState<Script[] | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listScripts().then(setScripts);
    listRecordings().then(setRecordings);
  }, []);

  async function handleNewScript() {
    const script = await createScript();
    router.push(`/editor/${script.id}`);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const { title, content } = await extractDocument(file);
      const script = await createScript({ title, content });
      router.push(`/editor/${script.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Import impossible.");
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce script ?")) return;
    await deleteScript(id);
    setScripts((prev) => prev?.filter((s) => s.id !== id) ?? null);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar
        right={
          <Link
            href="/videos"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <VideoIcon className="h-4 w-4" />
            Mes vidéos
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Bonjour</h1>
        <p className="mt-1 text-muted-foreground">
          Écrivez un script, réglez le défilement, enregistrez.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleNewScript}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-medium text-primary-foreground transition hover:bg-primary-hover"
          >
            <PlusIcon className="h-5 w-5" />
            Nouveau script
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            title="Importer un fichier .txt, .pdf ou .docx"
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3.5 font-medium text-card-foreground transition hover:border-primary/50 disabled:opacity-60"
          >
            <UploadIcon className={`h-5 w-5 ${importing ? "animate-spin" : ""}`} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={IMPORT_ACCEPT}
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
        {importing && (
          <p className="mt-2 text-sm text-muted-foreground">Importation du fichier…</p>
        )}

        <section className="mt-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-medium text-muted-foreground">
              Scripts récents
            </h2>
            {recordings.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {recordings.length} vidéo{recordings.length > 1 ? "s" : ""}{" "}
                enregistrée{recordings.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {scripts === null && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chargement…
            </p>
          )}

          {scripts?.length === 0 && (
            <div className="rounded-xl border border-dashed border-border py-12 text-center">
              <p className="text-muted-foreground">
                Aucun script pour l&apos;instant.
              </p>
              <button
                onClick={handleNewScript}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                Créer votre premier script
              </button>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {scripts?.map((script) => (
              <ScriptCard key={script.id} script={script} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
