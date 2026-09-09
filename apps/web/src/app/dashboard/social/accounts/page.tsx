"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { mutate } from "swr";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type {
  Company,
  SocialAccount,
  SocialCapabilityKind,
  SocialNetwork,
} from "@/lib/types";

const NETWORK_LABEL: Record<SocialNetwork, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
};

const CAPABILITIES: SocialCapabilityKind[] = [
  "AUTO_PUBLISH",
  "DRAFT_ONLY",
  "MANUAL",
  "UNVERIFIED",
  "EXPIRED",
];

const CAPABILITY_STYLE: Record<SocialCapabilityKind, string> = {
  AUTO_PUBLISH: "bg-emerald-100 text-emerald-700",
  DRAFT_ONLY: "bg-amber-100 text-amber-700",
  MANUAL: "bg-amber-100 text-amber-700",
  UNVERIFIED: "bg-slate-100 text-slate-700",
  EXPIRED: "bg-red-100 text-red-700",
};

const CAPABILITY_LABEL: Record<SocialCapabilityKind, string> = {
  AUTO_PUBLISH: "Publication auto",
  DRAFT_ONLY: "Brouillon",
  MANUAL: "Action manuelle",
  UNVERIFIED: "Non audité",
  EXPIRED: "Connexion expirée",
};

function fmt(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function SocialAccountsPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}
    >
      <SocialAccountsView />
    </Suspense>
  );
}

function SocialAccountsView() {
  const params = useSearchParams();
  const { data: accounts, isLoading } =
    useApi<SocialAccount[]>("/social/accounts");
  const { data: companies } = useApi<Company[]>("/crm/companies");

  const [companyId, setCompanyId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callbackNotice = useMemo(() => {
    const social = params.get("social");
    const status = params.get("status");
    if (!social || !status) return null;
    const net = social === "meta" ? "Meta (Instagram / Facebook)" : "TikTok";
    if (status === "connected") {
      const n = params.get("accounts");
      const handle = params.get("handle");
      return {
        ok: true,
        text: `${net} connecté${handle ? ` — @${handle}` : n ? ` — ${n} compte(s)` : ""}.`,
      };
    }
    if (status === "denied")
      return { ok: false, text: `Connexion ${net} refusée.` };
    return {
      ok: false,
      text: `Échec de la connexion ${net} : ${params.get("detail") ?? "erreur"}.`,
    };
  }, [params]);

  function refresh() {
    mutate("/social/accounts");
  }

  async function startConnect(provider: "meta" | "tiktok") {
    if (!companyId) {
      setError("Choisis d’abord un client.");
      return;
    }
    setError(null);
    setBusy(provider);
    try {
      const { url } = await api.get<{ url: string }>(
        `/social/${provider}/connect?companyId=${companyId}`,
      );
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur");
      setBusy(null);
    }
  }

  async function addTestAccount(network: SocialNetwork) {
    if (!companyId) {
      setError("Choisis d’abord un client.");
      return;
    }
    setError(null);
    setBusy(`test-${network}`);
    try {
      await api.post("/social/accounts", {
        companyId,
        network,
        handle: `test_${network.toLowerCase()}`,
        capability: "AUTO_PUBLISH",
      });
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  async function reconnect(account: SocialAccount) {
    setError(null);
    setBusy(account.id);
    try {
      const provider = account.network === "TIKTOK" ? "tiktok" : "meta";
      const { url } = await api.get<{ url: string }>(
        `/social/${provider}/connect?companyId=${account.companyId}`,
      );
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur");
      setBusy(null);
    }
  }

  async function setCapability(
    accountId: string,
    capability: SocialCapabilityKind,
  ) {
    setError(null);
    try {
      await api.put(`/social/accounts/${accountId}/capability`, { capability });
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur");
    }
  }

  async function disconnect(accountId: string) {
    if (
      !window.confirm("Révoquer cette connexion ? Les jetons seront supprimés.")
    )
      return;
    setError(null);
    try {
      await api.delete(`/social/accounts/${accountId}`);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur");
    }
  }

  const companyName = (id: string) =>
    companies?.find((c) => c.id === id)?.name ?? id;
  const grouped = groupByCompany(accounts ?? []);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Comptes connectés</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Connexion Instagram / Facebook (Meta) et TikTok par client, avec le
        statut de capacité de publication.
      </p>

      {callbackNotice && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            callbackNotice.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {callbackNotice.text}
        </div>
      )}

      <div className="mb-8 rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium text-foreground">
          Connecter un réseau
        </p>
        <div className="flex flex-wrap items-end gap-3">
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
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => startConnect("meta")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {busy === "meta" ? "Redirection…" : "Instagram / Facebook"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => startConnect("tiktok")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {busy === "tiktok" ? "Redirection…" : "TikTok"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          La connexion Meta nécessite un compte Instagram professionnel relié à
          une Page Facebook.
        </p>

        <div className="mt-3 border-t border-dashed border-border pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Test (sans OAuth) — crée un compte factice en « Publication auto »
            pour essayer le pipeline avec l’adaptateur de simulation :
          </p>
          <div className="flex flex-wrap gap-2">
            {(["INSTAGRAM", "FACEBOOK", "TIKTOK"] as SocialNetwork[]).map(
              (n) => (
                <button
                  key={n}
                  type="button"
                  disabled={busy !== null}
                  onClick={() => addTestAccount(n)}
                  className="rounded-md border border-dashed border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-50"
                >
                  {busy === `test-${n}` ? "…" : `+ ${NETWORK_LABEL[n]} (test)`}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isLoading && (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      )}
      {!isLoading && (accounts?.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun compte connecté pour l’instant.
        </p>
      )}

      <div className="space-y-6">
        {grouped.map(([cid, list]) => (
          <div key={cid}>
            <p className="mb-2 text-sm font-semibold text-foreground">
              {companyName(cid)}
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Réseau</th>
                    <th className="px-3 py-2 text-left font-medium">Compte</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Capacité
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Dernière synchro
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Jeton expire
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((a) => {
                    const cap = a.capability?.capability ?? "UNVERIFIED";
                    return (
                      <tr key={a.id} className="border-t border-border/70">
                        <td className="px-3 py-2 font-medium">
                          {NETWORK_LABEL[a.network]}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {a.handle ? `@${a.handle}` : (a.externalId ?? "—")}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CAPABILITY_STYLE[cap]}`}
                            title={a.capability?.reason ?? undefined}
                          >
                            {CAPABILITY_LABEL[cap]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {fmt(a.lastSyncAt)}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {fmt(a.tokenExpiresAt)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={cap}
                              onChange={(e) =>
                                setCapability(
                                  a.id,
                                  e.target.value as SocialCapabilityKind,
                                )
                              }
                              className="rounded-md border border-border bg-card px-2 py-1 text-xs"
                            >
                              {CAPABILITIES.map((c) => (
                                <option key={c} value={c}>
                                  {CAPABILITY_LABEL[c]}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => reconnect(a)}
                              disabled={busy !== null}
                              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                            >
                              Reconnecter
                            </button>
                            <button
                              type="button"
                              onClick={() => disconnect(a.id)}
                              className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              Révoquer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByCompany(
  accounts: SocialAccount[],
): [string, SocialAccount[]][] {
  const map = new Map<string, SocialAccount[]>();
  for (const a of accounts) {
    const list = map.get(a.companyId) ?? [];
    list.push(a);
    map.set(a.companyId, list);
  }
  return [...map.entries()];
}
