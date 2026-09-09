"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { mutate } from "swr";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type {
  Publication,
  PublicationTargetStatus,
  SocialNetwork,
} from "@/lib/types";

const KEY = "/publishing/publications";

const NETWORK_LABEL: Record<SocialNetwork, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
};

const DOT: Record<PublicationTargetStatus, string> = {
  DRAFT: "bg-muted-foreground",
  SCHEDULED: "bg-secondary",
  PUBLISHING: "bg-secondary",
  PUBLISHED: "bg-accent",
  ACTION_REQUISE: "bg-amber-400",
  FAILED: "bg-destructive",
  CANCELLED: "bg-muted-foreground",
};

type Overall = "Brouillon" | "Programmé" | "Publié" | "Attention";

const OVERALL_STYLE: Record<Overall, string> = {
  Brouillon: "bg-muted text-muted-foreground",
  Programmé: "bg-secondary/15 text-secondary",
  Publié: "bg-accent/15 text-accent",
  Attention: "bg-amber-400/15 text-amber-400",
};

function overallStatus(p: Publication): Overall {
  const s = p.targets.map((t) => t.status);
  if (s.length > 0 && s.every((x) => x === "PUBLISHED")) return "Publié";
  if (s.some((x) => x === "FAILED" || x === "ACTION_REQUISE"))
    return "Attention";
  if (s.some((x) => x === "SCHEDULED" || x === "PUBLISHING"))
    return "Programmé";
  return "Brouillon";
}

function fmt(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function PostsPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}
    >
      <PostsView />
    </Suspense>
  );
}

function PostsView() {
  const params = useSearchParams();
  const { data: posts, isLoading } = useApi<Publication[]>(KEY);
  const [filter, setFilter] = useState<Overall | "Tous">("Tous");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notice = useMemo(() => {
    if (params.get("ok")) return { ok: true, text: "Post créé." };
    const ig = params.get("ignores");
    if (ig)
      return {
        ok: false,
        text: `Post créé, mais ignoré pour : ${ig
          .split(",")
          .map((n) => NETWORK_LABEL[n as SocialNetwork] ?? n)
          .join(", ")} (réseau non connecté).`,
      };
    return null;
  }, [params]);

  const list = (posts ?? []).filter(
    (p) => filter === "Tous" || overallStatus(p) === filter,
  );

  async function act(fn: () => Promise<unknown>, id: string) {
    setError(null);
    setBusy(id);
    try {
      await fn();
      mutate(KEY);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Posts</h1>
          <p className="text-sm text-muted-foreground">
            Tous les contenus programmés et publiés, tous réseaux confondus.
          </p>
        </div>
        <Link
          href="/dashboard/posts/nouveau"
          className="glow rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          ＋ Créer un post
        </Link>
      </div>

      {notice && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            notice.ok
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-amber-400/30 bg-amber-400/10 text-amber-300"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          ["Tous", "Brouillon", "Programmé", "Publié", "Attention"] as const
        ).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {isLoading && (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      )}
      {!isLoading && list.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-sm text-muted-foreground">Aucun post ici.</p>
          <Link
            href="/dashboard/posts/nouveau"
            className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            ＋ Créer un post
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {list.map((p) => {
          const st = overallStatus(p);
          const err = p.targets.find((t) => t.lastError)?.lastError;
          return (
            <div key={p.id} className="glass rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.company?.name ?? "—"}
                    {p.scheduledAt && ` · ⏱ ${fmt(p.scheduledAt)}`}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${OVERALL_STYLE[st]}`}
                >
                  {st}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {p.targets.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Aucun réseau
                  </span>
                )}
                {p.targets.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-xs"
                    title={t.lastError ?? t.status}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${DOT[t.status]}`}
                    />
                    {NETWORK_LABEL[t.network]}
                  </span>
                ))}
              </div>

              {err && <p className="mt-2 text-xs text-amber-300">{err}</p>}

              <div className="mt-3 flex gap-2">
                {st !== "Publié" && (
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() =>
                      act(() => api.post(`${KEY}/${p.id}/publish-now`), p.id)
                    }
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                  >
                    Publier maintenant
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy === p.id}
                  onClick={() => {
                    if (window.confirm("Supprimer ce post ?"))
                      act(() => api.delete(`${KEY}/${p.id}`), p.id);
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
