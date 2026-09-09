import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fiche de renseignements — Réseaux sociaux',
  description: "Formulaire client pour la création de comptes sur les réseaux sociaux.",
};

export default function ReseauxSociauxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
