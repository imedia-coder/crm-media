"use client";

import { FormEvent, useState } from "react";
import { mutate } from "swr";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type {
  Company,
  Publication,
  PublicationTarget,
  PublicationTargetStatus,
  SocialAccount,
  SocialNetwork,
} from "@/lib/types";

const KEY = "/publishing/publications";

const NETWORK_LABEL: Record<SocialNetwork, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
};

const TARGET_STYLE: Record<PublicationTargetStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  PUBLISHING: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  ACTION_REQUISE: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

function fmt(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function refresh() {
  mutate(KEY);
}

export default function PublicationsPage() {
  const { data: publications, isLoading } = useApi<Publication[]>(KEY);
  const { data: companies } = useApi<Company[]>("/crm/companies");
  const { data: accounts } = useApi<SocialAccount[]>("/social/accounts");

  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function createPublication(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!companyId || !title.trim()) {
      setError("Client et titre requis.");
      return;
    }
    try {
      await api.post(KEY, { companyId, title: title.trim() });
      setTitle("");
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur");
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Publications</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Une publication → une ou plusieurs cibles réseau. La programmation est
        prise en charge par le moteur ; une cible en échec passe « Action
        requise » sans bloquer les autres.
      </p>

      <form
        onSubmit={createPublication}
        className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-foreground">
            Client
          </span>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">— choisir —</option>
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block flex-1 min-w-[220px]">
          <span className="mb-1 block text-sm font-medium text-foreground">
            Titre interne
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Teaser clip — semaine 1"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Nouvelle publication
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {isLoading && (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      )}
      {!isLoading && (publications?.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground">Aucune publication.</p>
      )}

      <div className="space-y-5">
        {publications?.map((p) => (
          <PublicationCard
            key={p.id}
            publication={p}
            accounts={accounts ?? []}
          />
        ))}
      </div>
    </div>
  );
}

function PublicationCard({
  publication,
  accounts,
}: {
  publication: Publication;
  accounts: SocialAccount[];
}) {
  const [scheduleAt, setScheduleAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const companyAccounts = accounts.filter(
    (a) => a.companyId === publication.companyId,
  );

  async function run(fn: () => Promise<unknown>) {
    setErr(null);
    setBusy(true);
    try {
      await fn();
      refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground">{publication.title}</p>
          <p className="text-xs text-muted-foreground">
            {publication.company?.name ?? "—"}
            {publication.scheduledAt &&
              ` · programmé le ${fmt(publication.scheduledAt)}`}
          </p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {publication.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Cibles */}
      <div className="mt-3 space-y-2">
        {publication.targets.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Aucune cible réseau — ajoute-en une ci-dessous.
          </p>
        )}
        {publication.targets.map((t) => (
          <TargetRow key={t.id} target={t} busy={busy} onRun={run} />
        ))}
      </div>

      {/* Ajout de cible */}
      <AddTargetForm
        publicationId={publication.id}
        accounts={companyAccounts}
        onDone={refresh}
      />

      {/* Actions publication */}
      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border/70 pt-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Programmer le
          </span>
          <input
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            className="rounded-md border border-border bg-card px-2 py-1 text-xs"
          />
        </label>
        <button
          type="button"
          disabled={busy || !scheduleAt}
          onClick={() =>
            run(() =>
              api.post(`${KEY}/${publication.id}/schedule`, {
                scheduledAt: new Date(scheduleAt).toISOString(),
              }),
            )
          }
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          Programmer
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(() => api.post(`${KEY}/${publication.id}/publish-now`))
          }
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          Publier maintenant
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Supprimer cette publication ?"))
              run(() => api.delete(`${KEY}/${publication.id}`));
          }}
          className="rounded-md px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Supprimer
        </button>
        {err && <span className="text-xs text-red-600">{err}</span>}
      </div>
    </div>
  );
}

function TargetRow({
  target,
  busy,
  onRun,
}: {
  target: PublicationTarget;
  busy: boolean;
  onRun: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const attempts = target.attempts?.length ?? 0;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-sm">
      <span className="font-medium">{NETWORK_LABEL[target.network]}</span>
      {target.account?.handle && (
        <span className="text-xs text-muted-foreground">
          @{target.account.handle}
        </span>
      )}
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${TARGET_STYLE[target.status]}`}
        title={target.lastError ?? undefined}
      >
        {target.status.replace(/_/g, " ")}
      </span>
      <span className="text-xs text-muted-foreground">
        mode {target.mode.toLowerCase()}
      </span>
      {attempts > 0 && (
        <span className="text-xs text-muted-foreground">
          {attempts} tentative{attempts > 1 ? "s" : ""}
        </span>
      )}
      {target.caption && (
        <span
          className="max-w-xs truncate text-xs text-muted-foreground"
          title={target.caption}
        >
          « {target.caption} »
        </span>
      )}
      {target.lastError && (
        <span className="w-full text-xs text-amber-700">
          {target.lastError}
        </span>
      )}
      <span className="ml-auto flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            onRun(() => api.post(`/publishing/targets/${target.id}/run`))
          }
          className="rounded-md border border-border px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-50"
        >
          Réessayer
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            onRun(() => api.delete(`/publishing/targets/${target.id}`))
          }
          className="rounded-md px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          ✕
        </button>
      </span>
    </div>
  );
}

function AddTargetForm({
  publicationId,
  accounts,
  onDone,
}: {
  publicationId: string;
  accounts: SocialAccount[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mediaIds, setMediaIds] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hashtagBusy, setHashtagBusy] = useState(false);

  async function generateHashtags() {
    setErr(null);
    setHashtagBusy(true);
    try {
      const network = accounts.find((a) => a.id === accountId)?.network;
      const { hashtags: tags } = await api.post<{ hashtags: string[] }>(
        "/ai/hashtags",
        { topic: caption.trim() || "contenu pour réseaux sociaux", network },
      );
      setHashtags(tags.join(", "));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Erreur");
    } finally {
      setHashtagBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
      >
        + Ajouter une cible réseau
      </button>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!accountId) {
      setErr("Choisis un compte réseau.");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/publishing/publications/${publicationId}/targets`, {
        accountId,
        caption: caption || undefined,
        hashtags: splitList(hashtags),
        mediaIds: splitList(mediaIds),
      });
      setOpen(false);
      setAccountId("");
      setCaption("");
      setHashtags("");
      setMediaIds("");
      onDone();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3"
    >
      <div className="flex flex-wrap gap-2">
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="rounded-md border border-border bg-card px-2 py-1 text-sm"
        >
          <option value="">— compte réseau —</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {NETWORK_LABEL[a.network]} {a.handle ? `@${a.handle}` : ""}
            </option>
          ))}
        </select>
      </div>
      {accounts.length === 0 && (
        <p className="text-xs text-amber-700">
          Aucun compte connecté pour ce client — connecte-en un dans « Comptes
          connectés ».
        </p>
      )}
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={2}
        placeholder="Légende…"
        className="w-full rounded-md border border-border bg-card px-2 py-1 text-sm"
      />
      <div className="flex gap-2">
        <input
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="hashtags séparés par des virgules"
          className="w-full rounded-md border border-border bg-card px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={generateHashtags}
          disabled={hashtagBusy}
          className="shrink-0 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          {hashtagBusy ? "…" : "✨ Générer"}
        </button>
      </div>
      <input
        value={mediaIds}
        onChange={(e) => setMediaIds(e.target.value)}
        placeholder="média : URL(s) publique(s) http(s), séparées par des virgules"
        className="w-full rounded-md border border-border bg-card px-2 py-1 text-sm"
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          Ajouter
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function splitList(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
