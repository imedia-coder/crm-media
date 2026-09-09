"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { api, ApiError, apiUpload } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type {
  Company,
  MediaAsset,
  SocialAccount,
  SocialNetwork,
} from "@/lib/types";

const NETWORKS: { id: SocialNetwork; label: string }[] = [
  { id: "INSTAGRAM", label: "Instagram" },
  { id: "TIKTOK", label: "TikTok" },
  { id: "FACEBOOK", label: "Facebook" },
];

export default function NewPostPage() {
  const router = useRouter();
  const { data: companies } = useApi<Company[]>("/crm/companies");
  const { data: accounts } = useApi<SocialAccount[]>("/social/accounts");

  const [companyId, setCompanyId] = useState("");
  const [text, setText] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [networks, setNetworks] = useState<SocialNetwork[]>([]);
  const [when, setWhen] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [hashBusy, setHashBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [libOpen, setLibOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const asset = await apiUpload<MediaAsset>("/marketing/media", fd);
        setMedia((cur) =>
          cur.some((m) => m.id === asset.id) ? cur : [...cur, asset],
        );
      }
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Échec de l'import du fichier",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addFromLibrary(asset: MediaAsset) {
    setMedia((cur) =>
      cur.some((m) => m.id === asset.id) ? cur : [...cur, asset],
    );
  }
  function removeMedia(id: string) {
    setMedia((cur) => cur.filter((m) => m.id !== id));
  }

  const connected = useMemo(() => {
    const set = new Set<SocialNetwork>();
    for (const a of accounts ?? [])
      if (a.companyId === companyId) set.add(a.network);
    return set;
  }, [accounts, companyId]);

  function toggleNetwork(n: SocialNetwork) {
    setNetworks((cur) =>
      cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n],
    );
  }

  async function generateHashtags() {
    setError(null);
    setHashBusy(true);
    try {
      const { hashtags: tags } = await api.post<{ hashtags: string[] }>(
        "/ai/hashtags",
        {
          topic: text.trim() || "contenu pour réseaux sociaux",
          network: networks[0],
        },
      );
      setHashtags(tags.join(", "));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur");
    } finally {
      setHashBusy(false);
    }
  }

  async function submit() {
    setError(null);
    if (!companyId) return setError("Choisis un client.");
    if (networks.length === 0) return setError("Coche au moins un réseau.");
    if (when === "schedule" && !scheduledAt)
      return setError("Choisis une date et une heure.");
    setBusy(true);
    try {
      const res = await api.post<{ skipped: SocialNetwork[] }>(
        "/publishing/posts",
        {
          companyId,
          networks,
          text: text.trim() || undefined,
          hashtags: splitList(hashtags),
          mediaIds: media.map((m) => m.id),
          when,
          scheduledAt:
            when === "schedule"
              ? new Date(scheduledAt).toISOString()
              : undefined,
        },
      );
      const q =
        res.skipped?.length > 0 ? `?ignores=${res.skipped.join(",")}` : "?ok=1";
      router.push(`/dashboard/posts${q}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold gradient-text">Créer un post</h1>
        <Link
          href="/dashboard/posts"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Annuler
        </Link>
      </div>

      <div className="gradient-border space-y-6 rounded-2xl p-6">
        {/* 1. Client */}
        <Field label="Client">
          <select
            value={companyId}
            onChange={(e) => {
              setCompanyId(e.target.value);
              setNetworks([]);
            }}
            className="input"
          >
            <option value="">— choisir —</option>
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        {/* 2. Réseaux */}
        <Field label="Réseaux">
          <div className="flex flex-wrap gap-2">
            {NETWORKS.map((n) => {
              const ok = connected.has(n.id);
              const on = networks.includes(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  disabled={!companyId || !ok}
                  onClick={() => toggleNetwork(n.id)}
                  className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                    on
                      ? "border-primary bg-primary/15 text-foreground glow-soft"
                      : "border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
                  }`}
                >
                  {n.label}
                  {companyId && !ok && (
                    <span className="ml-1.5 text-[10px] opacity-70">
                      non connecté
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {companyId && connected.size === 0 && (
            <p className="mt-2 text-xs text-amber-400">
              Aucun réseau connecté pour ce client —{" "}
              <Link href="/dashboard/social/accounts" className="underline">
                connecter un compte
              </Link>
              .
            </p>
          )}
        </Field>

        {/* 3. Texte */}
        <Field label="Texte du post">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Écris ta légende une seule fois…"
            className="input resize-y"
          />
          <div className="mt-2 flex items-center gap-2">
            <input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="hashtags"
              className="input flex-1"
            />
            <button
              type="button"
              onClick={generateHashtags}
              disabled={hashBusy}
              className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              {hashBusy ? "…" : "✨ Générer"}
            </button>
          </div>
        </Field>

        {/* 4. Média */}
        <Field label="Média">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            {uploading
              ? "Import en cours…"
              : "Glisse un fichier ici, ou clique pour choisir (image ou vidéo)"}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => void addFiles(e.target.files)}
            />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLibOpen((v) => !v)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              {libOpen
                ? "Fermer la bibliothèque"
                : "Choisir dans la bibliothèque"}
            </button>
          </div>

          {libOpen && (
            <LibraryPicker
              onPick={addFromLibrary}
              chosen={new Set(media.map((m) => m.id))}
            />
          )}

          {media.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {media.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2 py-1 text-xs"
                >
                  <span aria-hidden>
                    {m.mimeType.startsWith("video") ? "🎬" : "🖼"}
                  </span>
                  <span className="max-w-[10rem] truncate">{m.name}</span>
                  <button
                    type="button"
                    onClick={() => removeMedia(m.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </Field>

        {/* 5. Quand */}
        <Field label="Quand publier">
          <div className="flex gap-2">
            {(["now", "schedule"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWhen(w)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  when === w
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {w === "now" ? "Maintenant" : "Programmer"}
              </button>
            ))}
          </div>
          {when === "schedule" && (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="input mt-2"
            />
          )}
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="glow w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-px disabled:opacity-50"
        >
          {busy
            ? "…"
            : when === "now"
              ? "Publier maintenant"
              : "Programmer le post"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function LibraryPicker({
  onPick,
  chosen,
}: {
  onPick: (a: MediaAsset) => void;
  chosen: Set<string>;
}) {
  const { data: assets, isLoading } = useApi<MediaAsset[]>("/marketing/media");
  return (
    <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-card/40 p-2">
      {isLoading && (
        <p className="p-2 text-xs text-muted-foreground">Chargement…</p>
      )}
      {!isLoading && (assets?.length ?? 0) === 0 && (
        <p className="p-2 text-xs text-muted-foreground">
          Bibliothèque vide — importe des fichiers ci-dessus.
        </p>
      )}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {assets?.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onPick(a)}
            disabled={chosen.has(a.id)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-left text-xs hover:border-primary disabled:opacity-40"
          >
            <span aria-hidden>
              {a.mimeType.startsWith("video") ? "🎬" : "🖼"}
            </span>
            <span className="truncate">{a.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function splitList(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
