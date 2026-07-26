'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { NotificationBell } from '@/components/notification-bell';
import { useAuth } from '@/lib/auth-context';

const NAV_SECTIONS = [
  {
    title: 'Général',
    links: [
      { href: '/dashboard', label: 'Tableau de bord' },
      { href: '/dashboard/planning', label: 'Planning' },
      { href: '/dashboard/assistant', label: 'Assistant IA' },
    ],
  },
  {
    title: 'CRM',
    links: [
      { href: '/dashboard/crm/companies', label: 'Entreprises' },
      { href: '/dashboard/crm/deals', label: 'Pipeline' },
    ],
  },
  {
    title: 'Production',
    links: [
      { href: '/dashboard/projects', label: 'Projets' },
      { href: '/dashboard/documents', label: 'Documents' },
    ],
  },
  {
    title: 'Marketing',
    links: [
      { href: '/dashboard/marketing/content', label: 'Calendrier éditorial' },
      { href: '/dashboard/marketing/media', label: 'Médiathèque' },
      { href: '/dashboard/marketing/campaigns', label: 'Campagnes' },
    ],
  },
  {
    title: 'Facturation',
    links: [
      { href: '/dashboard/billing/quotes', label: 'Devis' },
      { href: '/dashboard/billing/invoices', label: 'Factures' },
      { href: '/dashboard/reporting', label: 'Reporting' },
    ],
  },
  {
    title: 'Administration',
    links: [
      { href: '/dashboard/team', label: 'Équipe' },
      { href: '/dashboard/automation', label: 'Automatisation' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, tenant, displayName, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Chargement...</div>;
  }

  if (user.isClient) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted-foreground">
        Cet espace est réservé aux équipes de l&apos;agence. Le portail client sera bientôt disponible ici.
      </div>
    );
  }

  const tenantName = tenant?.name ?? 'CRM Media';

  return (
    <div className="flex flex-1">
      <aside className="w-60 shrink-0 border-r border-border bg-card px-4 py-6">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {tenantName.charAt(0).toUpperCase()}
          </span>
          <p className="truncate text-sm font-semibold text-foreground">{tenantName}</p>
        </div>
        <nav className="space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.links.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block rounded-lg px-2 py-1.5 text-sm transition-colors ${
                        active
                          ? 'bg-primary font-medium text-primary-foreground shadow-sm'
                          : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3 shadow-sm">
          <div />
          <div className="flex items-center gap-4 text-sm">
            <NotificationBell />
            <span className="text-foreground/80">{displayName}</span>
            <button
              onClick={() => logout().then(() => router.push('/login'))}
              className="rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Déconnexion
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
