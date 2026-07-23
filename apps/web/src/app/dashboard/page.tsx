'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const SHORTCUTS = [
  { href: '/dashboard/crm/companies', label: 'Entreprises', description: 'Gérer prospects et clients' },
  { href: '/dashboard/crm/deals', label: 'Pipeline', description: 'Suivre les opportunités en cours' },
  { href: '/dashboard/projects', label: 'Projets', description: 'Suivre les projets et tâches' },
  { href: '/dashboard/documents', label: 'Documents', description: 'Centraliser les fichiers' },
  { href: '/dashboard/billing/quotes', label: 'Devis', description: 'Créer et envoyer des devis' },
  { href: '/dashboard/billing/invoices', label: 'Factures', description: 'Facturer et suivre les paiements' },
];

export default function DashboardHome() {
  const { displayName } = useAuth();

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Bonjour {displayName?.split(' ')[0] ?? ''}</h1>
      <p className="mb-6 text-sm text-slate-500">Voici un accès rapide aux modules de votre agence.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SHORTCUTS.map((shortcut) => (
          <Link
            key={shortcut.href}
            href={shortcut.href}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400"
          >
            <p className="font-medium text-slate-900">{shortcut.label}</p>
            <p className="mt-1 text-sm text-slate-500">{shortcut.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
