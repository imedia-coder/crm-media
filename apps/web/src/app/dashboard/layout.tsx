"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/lib/auth-context";

// Périmètre "Iniciativas Content" (docs/VISION-INICIATIVAS-CONTENT.md).
const NAV_SECTIONS = [
  {
    title: "Général",
    links: [
      { href: "/dashboard", label: "Tableau de bord" },
      { href: "/dashboard/assistant", label: "Assistant IA" },
    ],
  },
  {
    title: "Clients",
    links: [{ href: "/dashboard/crm/companies", label: "Clients" }],
  },
  {
    title: "Contenus",
    links: [
      { href: "/dashboard/posts", label: "Posts" },
      { href: "/dashboard/marketing/media", label: "Bibliothèque" },
      { href: "/dashboard/marketing/campaigns", label: "Campagnes" },
    ],
  },
  {
    title: "Réglages",
    links: [
      { href: "/dashboard/social/accounts", label: "Réseaux connectés" },
      { href: "/dashboard/team", label: "Équipe" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, tenant, displayName, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (user.isClient) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
        Cet espace est réservé aux équipes de l&apos;agence.
      </div>
    );
  }

  const tenantName = tenant?.name ?? "Iniciativas Content";

  return (
    <div className="flex flex-1">
      <aside className="glass sticky top-0 flex h-screen w-60 shrink-0 flex-col px-3 py-5 print:hidden">
        <div className="mb-7 flex items-center gap-2.5 px-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl brand-fill text-sm font-black text-white glow-soft">
            {tenantName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {tenantName}
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Content
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const active =
                    pathname === link.href ||
                    (link.href !== "/dashboard" &&
                      pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative block rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-primary/12 font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full brand-fill" />
                      )}
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-10 flex items-center justify-between px-6 py-3 print:hidden">
          <Link
            href="/dashboard/posts/nouveau"
            className="glow inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-px"
          >
            <span className="text-base leading-none">＋</span> Créer un post
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <NotificationBell />
            <span className="text-muted-foreground">{displayName}</span>
            <button
              onClick={() => logout().then(() => router.push("/login"))}
              className="rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Déconnexion
            </button>
          </div>
        </header>
        <main className="dotgrid flex-1 overflow-y-auto px-6 py-6 print:overflow-visible print:px-0 print:py-0">
          {children}
        </main>
      </div>
    </div>
  );
}
