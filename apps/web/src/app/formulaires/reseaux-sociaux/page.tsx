'use client';

import { ReactNode, useEffect, useState } from 'react';

const STORAGE_KEY = 'crm-media-fiche-reseaux-sociaux-v1';

type TextState = Record<string, string>;
type CheckState = Record<string, string[]>;

const STYLE_OPTIONS = ['Élégant', 'Moderne', 'Minimaliste', 'Dynamique', 'Premium', 'Autre'];
const RESEAUX_OPTIONS = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'YouTube', 'Pinterest', 'Autre'];
const OBJECTIF_OPTIONS = [
  'Développer la notoriété',
  'Attirer de nouveaux clients',
  'Présenter les produits/services',
  'Générer des ventes',
  'Développer une communauté',
  'Recevoir des demandes de contact',
  'Autre',
];
const TYPES_CONTENUS_OPTIONS = [
  'Publications',
  'Stories',
  'Reels / vidéos',
  'Carrousels',
  'Témoignages clients',
  'Promotions / offres',
  'Présentation des produits ou services',
  'Conseils / informations',
];
const TON_OPTIONS = ['Professionnel', 'Accessible', 'Dynamique', 'Premium', 'Authentique', 'Humoristique'];
const ELEMENTS_OPTIONS = [
  'Logo en bonne qualité',
  "Photos de l'entreprise",
  'Photos des produits / services',
  'Vidéos disponibles',
  'Charte graphique',
  'Coordonnées professionnelles',
  'Textes de présentation',
  'Catalogue / plaquette commerciale',
  'Autre',
];

export default function ReseauxSociauxFormPage() {
  const [text, setText] = useState<TextState>({});
  const [checks, setChecks] = useState<CheckState>({});
  const [status, setStatus] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Hydratation depuis localStorage (client-only) — pas un calcul
        // derivable au rendu.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setText(parsed.text ?? {});
        setChecks(parsed.checks ?? {});
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ text, checks }));
      setStatus('Enregistré dans ce navigateur ✓');
      const clearTimer = setTimeout(() => setStatus(''), 2000);
      return () => clearTimeout(clearTimer);
    }, 500);
    return () => clearTimeout(timer);
  }, [text, checks, hydrated]);

  function setField(name: string, value: string) {
    setText((prev) => ({ ...prev, [name]: value }));
  }

  function toggleCheck(group: string, value: string) {
    setChecks((prev) => {
      const current = prev[group] ?? [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [group]: next };
    });
  }

  function isChecked(group: string, value: string) {
    return (checks[group] ?? []).includes(value);
  }

  function resetForm() {
    if (!window.confirm('Effacer toutes les informations saisies dans ce formulaire ?')) return;
    setText({});
    setChecks({});
    window.localStorage.removeItem(STORAGE_KEY);
    setStatus('Formulaire réinitialisé');
    setTimeout(() => setStatus(''), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="sticky top-0 z-20 -mx-4 mb-8 flex items-center justify-end gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur print:hidden">
        <span className="mr-auto text-xs text-emerald-600">{status}</span>
        <button
          type="button"
          onClick={resetForm}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Réinitialiser
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          Enregistrer en PDF
        </button>
      </div>

      <header className="mb-8 border-b-2 border-primary pb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">CRM Media</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Fiche de renseignements</h1>
        <p className="mt-1 text-base font-medium text-primary">Création de comptes sur les réseaux sociaux</p>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Merci de compléter ce formulaire directement dans votre navigateur — vos réponses sont sauvegardées
          automatiquement pendant la saisie. Une fois terminé, cliquez sur « Enregistrer en PDF » puis renvoyez-nous
          le fichier par e-mail ou WhatsApp.
        </p>
      </header>

      <div className="space-y-6">
        <Section number={1} title="Informations sur l'entreprise">
          <TextInput label="Nom de l'entreprise" value={text.nom_entreprise} onChange={(v) => setField('nom_entreprise', v)} full />
          <TextInput label="Nom commercial" value={text.nom_commercial} onChange={(v) => setField('nom_commercial', v)} full />
          <TextInput label="Activité / secteur" value={text.activite_secteur} onChange={(v) => setField('activite_secteur', v)} full />
          <TextArea
            label="Description de l'activité"
            value={text.description_activite}
            onChange={(v) => setField('description_activite', v)}
            full
          />
          <TextInput label="Adresse" value={text.adresse_entreprise} onChange={(v) => setField('adresse_entreprise', v)} full />
          <TextInput
            label="Téléphone"
            type="tel"
            value={text.telephone_entreprise}
            onChange={(v) => setField('telephone_entreprise', v)}
          />
          <TextInput
            label="Adresse e-mail professionnelle"
            type="email"
            value={text.email_professionnel}
            onChange={(v) => setField('email_professionnel', v)}
          />
          <TextInput
            label="Site internet"
            type="url"
            placeholder="https://"
            value={text.site_internet}
            onChange={(v) => setField('site_internet', v)}
          />
          <TextInput
            label="Horaires d'ouverture"
            value={text.horaires_ouverture}
            onChange={(v) => setField('horaires_ouverture', v)}
          />
        </Section>

        <Section number={2} title="Identité de la marque">
          <YesNo
            question="Logo disponible"
            name="logo_disponible"
            value={text.logo_disponible}
            onChange={(v) => setField('logo_disponible', v)}
          />
          <YesNo
            question="Charte graphique disponible"
            name="charte_graphique_disponible"
            value={text.charte_graphique_disponible}
            onChange={(v) => setField('charte_graphique_disponible', v)}
          />
          <TextInput
            label="Couleurs principales"
            value={text.couleurs_principales}
            onChange={(v) => setField('couleurs_principales', v)}
          />
          <TextInput label="Polices utilisées" value={text.polices_utilisees} onChange={(v) => setField('polices_utilisees', v)} />
          <CheckboxGroup
            label="Style souhaité"
            options={STYLE_OPTIONS}
            isChecked={(v) => isChecked('style_souhaite', v)}
            onToggle={(v) => toggleCheck('style_souhaite', v)}
            full
          />
          <TextInput
            label="Si « Autre », précisez"
            value={text.style_souhaite_autre}
            onChange={(v) => setField('style_souhaite_autre', v)}
            full
          />
          <TextInput label="Slogan / phrase d'accroche" value={text.slogan_accroche} onChange={(v) => setField('slogan_accroche', v)} full />
        </Section>

        <Section number={3} title="Réseaux sociaux à créer">
          <CheckboxGroup
            label="Cochez les réseaux concernés"
            options={RESEAUX_OPTIONS}
            isChecked={(v) => isChecked('reseaux', v)}
            onToggle={(v) => toggleCheck('reseaux', v)}
            full
          />
          <TextInput label="Si « Autre », précisez" value={text.reseaux_autre} onChange={(v) => setField('reseaux_autre', v)} full />
        </Section>

        <Section number={4} title="Informations pour les profils">
          <TextInput
            label="Nom souhaité du compte / @identifiant"
            value={text.identifiant_souhaite}
            onChange={(v) => setField('identifiant_souhaite', v)}
          />
          <TextInput
            label="Nom à afficher sur le profil"
            value={text.nom_affichage_profil}
            onChange={(v) => setField('nom_affichage_profil', v)}
          />
          <TextArea label="Biographie souhaitée" value={text.biographie_souhaitee} onChange={(v) => setField('biographie_souhaitee', v)} full />
          <TextInput
            label="Lien à intégrer dans la bio"
            type="url"
            placeholder="https://"
            value={text.lien_bio}
            onChange={(v) => setField('lien_bio', v)}
            full
          />
          <TextInput
            label="Photo de profil souhaitée"
            hint="description"
            value={text.photo_profil_souhaitee}
            onChange={(v) => setField('photo_profil_souhaitee', v)}
          />
          <TextInput
            label="Image de couverture souhaitée"
            hint="si applicable"
            value={text.image_couverture_souhaitee}
            onChange={(v) => setField('image_couverture_souhaitee', v)}
          />
          <TextInput label="Adresse e-mail publique" type="email" value={text.email_public} onChange={(v) => setField('email_public', v)} />
          <TextInput
            label="Numéro de téléphone public"
            type="tel"
            value={text.telephone_public}
            onChange={(v) => setField('telephone_public', v)}
          />
          <TextInput
            label="Adresse professionnelle à afficher"
            value={text.adresse_professionnelle_affichee}
            onChange={(v) => setField('adresse_professionnelle_affichee', v)}
            full
          />
        </Section>

        <Section number={5} title="Positionnement et objectifs">
          <CheckboxGroup
            label="Objectif principal des réseaux sociaux"
            options={OBJECTIF_OPTIONS}
            isChecked={(v) => isChecked('objectif', v)}
            onToggle={(v) => toggleCheck('objectif', v)}
            full
          />
          <TextInput label="Si « Autre », précisez" value={text.objectif_autre} onChange={(v) => setField('objectif_autre', v)} full />
          <TextInput label="Clientèle cible" value={text.clientele_cible} onChange={(v) => setField('clientele_cible', v)} />
          <TextInput
            label="Zone géographique ciblée"
            value={text.zone_geographique_ciblee}
            onChange={(v) => setField('zone_geographique_ciblee', v)}
          />
          <TextArea
            label="Principaux produits ou services à mettre en avant"
            value={text.produits_services_avant}
            onChange={(v) => setField('produits_services_avant', v)}
            full
          />
          <TextArea
            label="Comptes concurrents ou comptes de référence"
            value={text.comptes_reference}
            onChange={(v) => setField('comptes_reference', v)}
            full
          />
        </Section>

        <Section number={6} title="Contenus et communication">
          <CheckboxGroup
            label="Types de contenus souhaités"
            options={TYPES_CONTENUS_OPTIONS}
            isChecked={(v) => isChecked('types_contenus', v)}
            onToggle={(v) => toggleCheck('types_contenus', v)}
            full
          />
          <CheckboxGroup
            label="Ton de communication souhaité"
            options={TON_OPTIONS}
            isChecked={(v) => isChecked('ton_communication', v)}
            onToggle={(v) => toggleCheck('ton_communication', v)}
            full
          />
        </Section>

        <Section number={7} title="Éléments à fournir">
          <CheckboxGroup
            label="Cochez les éléments que vous pouvez nous transmettre"
            options={ELEMENTS_OPTIONS}
            isChecked={(v) => isChecked('elements_fournir', v)}
            onToggle={(v) => toggleCheck('elements_fournir', v)}
            full
          />
          <TextInput
            label="Si « Autre », précisez"
            value={text.elements_fournir_autre}
            onChange={(v) => setField('elements_fournir_autre', v)}
            full
          />
        </Section>

        <Section number={8} title="Validation">
          <TextInput
            label="Nom et prénom du responsable"
            value={text.responsable_nom_prenom}
            onChange={(v) => setField('responsable_nom_prenom', v)}
          />
          <TextInput label="Date" type="date" value={text.date_validation} onChange={(v) => setField('date_validation', v)} />
          <TextInput
            label="Signature"
            hint="tapez votre nom pour valider"
            value={text.signature_nom}
            onChange={(v) => setField('signature_nom', v)}
            full
          />
          <label className="col-span-full flex items-start gap-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={isChecked('certification', 'oui')}
              onChange={() => toggleCheck('certification', 'oui')}
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ accentColor: 'var(--primary)' }}
            />
            <span>
              Je certifie que les informations fournies ci-dessus sont exactes et j&apos;autorise CRM Media à les
              utiliser pour la création et la configuration de mes comptes sur les réseaux sociaux.
            </span>
          </label>
          <TextArea
            label="Remarques ou informations complémentaires"
            value={text.remarques_complementaires}
            onChange={(v) => setField('remarques_complementaires', v)}
            full
          />
        </Section>
      </div>

      <footer className="mt-10 text-center text-xs text-muted-foreground">
        CRM Media — Fiche de renseignements pour la création de comptes sur les réseaux sociaux
      </footer>
    </div>
  );
}

function Section({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <legend className="-ml-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
        {number}. {title}
      </legend>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function fieldClasses(full?: boolean) {
  return full ? 'col-span-full' : '';
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  full,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  full?: boolean;
}) {
  return (
    <label className={fieldClasses(full)}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {hint && <span className="ml-1.5 font-normal normal-case text-muted-foreground/70">({hint})</span>}
      </span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  full,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  full?: boolean;
}) {
  return (
    <label className={fieldClasses(full)}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}

function YesNo({
  question,
  name,
  value,
  onChange,
}: {
  question: string;
  name: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="col-span-full flex items-center justify-between gap-4 border-t border-dashed border-border py-3 first:border-t-0 first:pt-0">
      <span className="text-sm text-foreground">{question}</span>
      <div className="flex shrink-0 gap-4">
        {['Oui', 'Non'].map((opt) => (
          <label key={opt} className="flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
            <input
              type="radio"
              name={name}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="h-4 w-4"
              style={{ accentColor: 'var(--primary)' }}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

function CheckboxGroup({
  label,
  options,
  isChecked,
  onToggle,
  full,
}: {
  label: string;
  options: string[];
  isChecked: (value: string) => boolean;
  onToggle: (value: string) => void;
  full?: boolean;
}) {
  return (
    <div className={fieldClasses(full)}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {options.map((opt) => (
          <label key={opt} className="flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isChecked(opt)}
              onChange={() => onToggle(opt)}
              className="h-4 w-4 shrink-0"
              style={{ accentColor: 'var(--primary)' }}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}
