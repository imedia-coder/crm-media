'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

const NAV_SECTIONS = [
  {
    title: 'Général',
    links: [
      { href: '/dashboard', label: 'Tableau de bord' },
      { href: '/dashboard/planning', label: 'Planning' },
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
    return <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Chargement...</div>;
  }

  if (user.isClient) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-slate-500">
        Cet espace est réservé aux équipes de l&apos;agence. Le portail client sera bientôt disponible ici.
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white px-4 py-6">
        <p className="mb-6 px-2 text-sm font-semibold text-slate-900">{tenant?.name ?? 'CRM Media'}</p>
        <nav className="space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.links.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block rounded-md px-2 py-1.5 text-sm ${
                        active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
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
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div />
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">{displayName}</span>
            <button onClick={() => logout().then(() => router.push('/login'))} className="text-slate-500 underline">
              Déconnexion
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
