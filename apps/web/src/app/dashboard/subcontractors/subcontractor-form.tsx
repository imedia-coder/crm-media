'use client';

import { FormEvent, ReactNode, useState } from 'react';
import { Field } from '@/components/form-field';
import { Subcontractor } from '@/lib/types';

export interface SubcontractorFormValues {
  firstName: string;
  lastName: string;
  personalAddress: string;
  personalPostalCode: string;
  personalCity: string;
  personalPhone: string;
  personalEmail: string;
  idDocumentNumber: string;
  idDocumentValidUntil: string;

  companyName: string;
  legalForm: string;
  siret: string;
  vatNumber: string;
  companyAddress: string;
  companyPostalCode: string;
  companyCity: string;
  companyPhone: string;
  companyEmail: string;

  bankAccountHolder: string;
  bankName: string;
  iban: string;
  bic: string;

  insuranceCompany: string;
  insurancePolicyNumber: string;
  insuranceValidUntil: string;
  hasLiabilityInsurance: '' | 'Oui' | 'Non';
  hasTenYearInsurance: '' | 'Oui' | 'Non';

  serviceType: string;
  dailyRate: string;
  interventionZone: string;
  availableFrom: string;
  experienceNotes: string;

  signedAt: string;
  signedLocation: string;
}

const EMPTY_VALUES: SubcontractorFormValues = {
  firstName: '',
  lastName: '',
  personalAddress: '',
  personalPostalCode: '',
  personalCity: '',
  personalPhone: '',
  personalEmail: '',
  idDocumentNumber: '',
  idDocumentValidUntil: '',
  companyName: '',
  legalForm: '',
  siret: '',
  vatNumber: '',
  companyAddress: '',
  companyPostalCode: '',
  companyCity: '',
  companyPhone: '',
  companyEmail: '',
  bankAccountHolder: '',
  bankName: '',
  iban: '',
  bic: '',
  insuranceCompany: '',
  insurancePolicyNumber: '',
  insuranceValidUntil: '',
  hasLiabilityInsurance: '',
  hasTenYearInsurance: '',
  serviceType: '',
  dailyRate: '',
  interventionZone: '',
  availableFrom: '',
  experienceNotes: '',
  signedAt: '',
  signedLocation: '',
};

export function subcontractorToFormValues(s: Subcontractor): SubcontractorFormValues {
  return {
    firstName: s.firstName,
    lastName: s.lastName,
    personalAddress: s.personalAddress ?? '',
    personalPostalCode: s.personalPostalCode ?? '',
    personalCity: s.personalCity ?? '',
    personalPhone: s.personalPhone ?? '',
    personalEmail: s.personalEmail ?? '',
    idDocumentNumber: s.idDocumentNumber ?? '',
    idDocumentValidUntil: s.idDocumentValidUntil?.slice(0, 10) ?? '',
    companyName: s.companyName ?? '',
    legalForm: s.legalForm ?? '',
    siret: s.siret ?? '',
    vatNumber: s.vatNumber ?? '',
    companyAddress: s.companyAddress ?? '',
    companyPostalCode: s.companyPostalCode ?? '',
    companyCity: s.companyCity ?? '',
    companyPhone: s.companyPhone ?? '',
    companyEmail: s.companyEmail ?? '',
    bankAccountHolder: s.bankAccountHolder ?? '',
    bankName: s.bankName ?? '',
    iban: s.iban ?? '',
    bic: s.bic ?? '',
    insuranceCompany: s.insuranceCompany ?? '',
    insurancePolicyNumber: s.insurancePolicyNumber ?? '',
    insuranceValidUntil: s.insuranceValidUntil?.slice(0, 10) ?? '',
    hasLiabilityInsurance: s.hasLiabilityInsurance === null ? '' : s.hasLiabilityInsurance ? 'Oui' : 'Non',
    hasTenYearInsurance: s.hasTenYearInsurance === null ? '' : s.hasTenYearInsurance ? 'Oui' : 'Non',
    serviceType: s.serviceType ?? '',
    dailyRate: s.dailyRate ?? '',
    interventionZone: s.interventionZone ?? '',
    availableFrom: s.availableFrom?.slice(0, 10) ?? '',
    experienceNotes: s.experienceNotes ?? '',
    signedAt: s.signedAt?.slice(0, 10) ?? '',
    signedLocation: s.signedLocation ?? '',
  };
}

export function formValuesToPayload(values: SubcontractorFormValues) {
  const toOptional = (v: string) => (v.trim() === '' ? undefined : v.trim());
  const toBool = (v: '' | 'Oui' | 'Non') => (v === '' ? undefined : v === 'Oui');
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    personalAddress: toOptional(values.personalAddress),
    personalPostalCode: toOptional(values.personalPostalCode),
    personalCity: toOptional(values.personalCity),
    personalPhone: toOptional(values.personalPhone),
    personalEmail: toOptional(values.personalEmail),
    idDocumentNumber: toOptional(values.idDocumentNumber),
    idDocumentValidUntil: toOptional(values.idDocumentValidUntil),
    companyName: toOptional(values.companyName),
    legalForm: toOptional(values.legalForm),
    siret: toOptional(values.siret),
    vatNumber: toOptional(values.vatNumber),
    companyAddress: toOptional(values.companyAddress),
    companyPostalCode: toOptional(values.companyPostalCode),
    companyCity: toOptional(values.companyCity),
    companyPhone: toOptional(values.companyPhone),
    companyEmail: toOptional(values.companyEmail),
    bankAccountHolder: toOptional(values.bankAccountHolder),
    bankName: toOptional(values.bankName),
    iban: toOptional(values.iban),
    bic: toOptional(values.bic),
    insuranceCompany: toOptional(values.insuranceCompany),
    insurancePolicyNumber: toOptional(values.insurancePolicyNumber),
    insuranceValidUntil: toOptional(values.insuranceValidUntil),
    hasLiabilityInsurance: toBool(values.hasLiabilityInsurance),
    hasTenYearInsurance: toBool(values.hasTenYearInsurance),
    serviceType: toOptional(values.serviceType),
    dailyRate: values.dailyRate.trim() === '' ? undefined : Number(values.dailyRate),
    interventionZone: toOptional(values.interventionZone),
    availableFrom: toOptional(values.availableFrom),
    experienceNotes: toOptional(values.experienceNotes),
    signedAt: toOptional(values.signedAt),
    signedLocation: toOptional(values.signedLocation),
  };
}

function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: '' | 'Oui' | 'Non';
  onChange: (v: '' | 'Oui' | 'Non') => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as '' | 'Oui' | 'Non')}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
      >
        <option value="">Non renseigné</option>
        <option value="Oui">Oui</option>
        <option value="Non">Non</option>
      </select>
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm print:break-inside-avoid print:shadow-none">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function SubcontractorForm({
  initial,
  onSubmit,
  submitLabel,
  isSubmitting,
  error,
  extraActions,
}: {
  initial?: SubcontractorFormValues;
  onSubmit: (values: SubcontractorFormValues) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  error: string | null;
  extraActions?: ReactNode;
}) {
  const [values, setValues] = useState<SubcontractorFormValues>(initial ?? EMPTY_VALUES);

  function set<K extends keyof SubcontractorFormValues>(key: K) {
    return (value: string) => setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="1. Identité du sous-traitant">
        <Field label="Nom" value={values.lastName} onChange={set('lastName')} />
        <Field label="Prénom" value={values.firstName} onChange={set('firstName')} />
        <div className="sm:col-span-2">
          <Field label="Adresse (n°, rue)" value={values.personalAddress} onChange={set('personalAddress')} required={false} />
        </div>
        <Field label="Code postal" value={values.personalPostalCode} onChange={set('personalPostalCode')} required={false} />
        <Field label="Ville" value={values.personalCity} onChange={set('personalCity')} required={false} />
        <Field label="Téléphone" value={values.personalPhone} onChange={set('personalPhone')} required={false} />
        <Field label="Email" type="email" value={values.personalEmail} onChange={set('personalEmail')} required={false} />
        <Field label="N° carte d'identité / passeport" value={values.idDocumentNumber} onChange={set('idDocumentNumber')} required={false} />
        <Field label="Date de validité" type="date" value={values.idDocumentValidUntil} onChange={set('idDocumentValidUntil')} required={false} />
      </Section>

      <Section title="2. Identification de l'entreprise">
        <div className="sm:col-span-2">
          <Field label="Raison sociale" value={values.companyName} onChange={set('companyName')} required={false} />
        </div>
        <Field label="Forme juridique" value={values.legalForm} onChange={set('legalForm')} required={false} placeholder="SARL, auto-entrepreneur..." />
        <Field label="N° SIRET / SIREN" value={values.siret} onChange={set('siret')} required={false} />
        <div className="sm:col-span-2">
          <Field label="N° TVA intracommunautaire" value={values.vatNumber} onChange={set('vatNumber')} required={false} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Adresse du siège social" value={values.companyAddress} onChange={set('companyAddress')} required={false} />
        </div>
        <Field label="Code postal" value={values.companyPostalCode} onChange={set('companyPostalCode')} required={false} />
        <Field label="Ville" value={values.companyCity} onChange={set('companyCity')} required={false} />
        <Field label="Téléphone entreprise" value={values.companyPhone} onChange={set('companyPhone')} required={false} />
        <Field label="Email entreprise" type="email" value={values.companyEmail} onChange={set('companyEmail')} required={false} />
      </Section>

      <Section title="3. Coordonnées bancaires">
        <div className="sm:col-span-2">
          <Field label="Titulaire du compte" value={values.bankAccountHolder} onChange={set('bankAccountHolder')} required={false} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Nom de la banque" value={values.bankName} onChange={set('bankName')} required={false} />
        </div>
        <Field label="IBAN" value={values.iban} onChange={set('iban')} required={false} />
        <Field label="BIC / SWIFT" value={values.bic} onChange={set('bic')} required={false} />
      </Section>

      <Section title="4. Assurances">
        <div className="sm:col-span-2">
          <Field label="Compagnie d'assurance" value={values.insuranceCompany} onChange={set('insuranceCompany')} required={false} />
        </div>
        <Field label="N° de police" value={values.insurancePolicyNumber} onChange={set('insurancePolicyNumber')} required={false} />
        <Field label="Date de validité de l'attestation" type="date" value={values.insuranceValidUntil} onChange={set('insuranceValidUntil')} required={false} />
        <YesNoField
          label="Responsabilité civile professionnelle souscrite"
          value={values.hasLiabilityInsurance}
          onChange={(v) => setValues((prev) => ({ ...prev, hasLiabilityInsurance: v }))}
        />
        <YesNoField
          label="Assurance décennale souscrite (si applicable)"
          value={values.hasTenYearInsurance}
          onChange={(v) => setValues((prev) => ({ ...prev, hasTenYearInsurance: v }))}
        />
      </Section>

      <Section title="5. Détails de la prestation">
        <div className="sm:col-span-2">
          <Field label="Type de prestation / spécialité" value={values.serviceType} onChange={set('serviceType')} required={false} />
        </div>
        <Field label="Taux journalier (TJM, €)" type="number" value={values.dailyRate} onChange={set('dailyRate')} required={false} />
        <Field label="Zone d'intervention" value={values.interventionZone} onChange={set('interventionZone')} required={false} />
        <Field label="Disponibilité (date de début possible)" type="date" value={values.availableFrom} onChange={set('availableFrom')} required={false} />
        <div className="sm:col-span-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">Références / expérience (facultatif)</span>
            <textarea
              value={values.experienceNotes}
              onChange={(e) => setValues((v) => ({ ...v, experienceNotes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </label>
        </div>
      </Section>

      <Section title="Signature">
        <Field label="Fait à" value={values.signedLocation} onChange={set('signedLocation')} required={false} />
        <Field label="Le" type="date" value={values.signedAt} onChange={set('signedAt')} required={false} />
      </Section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 print:hidden">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isSubmitting ? 'Enregistrement...' : submitLabel}
        </button>
        {extraActions}
      </div>
    </form>
  );
}
