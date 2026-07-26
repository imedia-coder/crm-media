'use client';

import { FormEvent, useState } from 'react';
import { mutate } from 'swr';
import { Field } from '@/components/form-field';
import { api, ApiError } from '@/lib/api';
import { AutomationAction, AutomationRule, AutomationRuleWithRuns, AutomationTrigger } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const RULES_KEY = '/automation/rules';

const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  QUOTE_ACCEPTED: 'Devis accepté',
  INVOICE_PAID: 'Facture payée',
  DEAL_WON: 'Deal gagné',
};

const ACTION_LABELS: Record<AutomationAction['type'], string> = {
  CREATE_PROJECT: 'Créer un projet',
  CREATE_TASK: 'Créer une tâche',
  SEND_NOTIFICATION: 'Envoyer une notification',
};

function defaultActionFor(type: AutomationAction['type']): AutomationAction {
  switch (type) {
    case 'CREATE_PROJECT':
      return { type, config: { nameTemplate: '' } };
    case 'CREATE_TASK':
      return { type, config: { titleTemplate: '', useCreatedProject: true } };
    case 'SEND_NOTIFICATION':
      return { type, config: { titleTemplate: '' } };
  }
}

export default function AutomationPage() {
  const { data: rules } = useApi<AutomationRule[]>(RULES_KEY);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<AutomationTrigger>('QUOTE_ACCEPTED');
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedRule, setExpandedRule] = useState<AutomationRuleWithRuns | null>(null);

  function addAction() {
    setActions((prev) => [...prev, defaultActionFor('CREATE_PROJECT')]);
  }

  function updateAction(index: number, next: AutomationAction) {
    setActions((prev) => prev.map((a, i) => (i === index ? next : a)));
  }

  function removeAction(index: number) {
    setActions((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (actions.length === 0) {
      setError('Ajoutez au moins une action.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.post(RULES_KEY, { name, trigger, actions });
      setName('');
      setTrigger('QUOTE_ACCEPTED');
      setActions([]);
      mutate(RULES_KEY);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(rule: AutomationRule) {
    await api.patch(`${RULES_KEY}/${rule.id}`, { isActive: !rule.isActive });
    mutate(RULES_KEY);
  }

  async function removeRule(id: string) {
    if (!window.confirm('Supprimer cette règle d’automatisation ?')) return;
    await api.delete(`${RULES_KEY}/${id}`);
    if (expandedRule?.id === id) setExpandedRule(null);
    mutate(RULES_KEY);
  }

  async function showHistory(id: string) {
    if (expandedRule?.id === id) {
      setExpandedRule(null);
      return;
    }
    const detail = await api.get<AutomationRuleWithRuns>(`${RULES_KEY}/${id}`);
    setExpandedRule(detail);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Automatisation</h1>
        <p className="text-sm text-slate-500">
          Définissez des règles « déclencheur → actions » : par exemple, quand un devis est accepté, créez
          automatiquement le projet et sa première tâche.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-xl border border-border bg-card shadow-sm p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Nouvelle règle</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Field label="Nom de la règle" value={name} onChange={setName} placeholder="Devis accepté → lancer le projet" />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Déclencheur</span>
              <select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value as AutomationTrigger)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Actions (exécutées dans l&apos;ordre)</span>
              <button
                type="button"
                onClick={addAction}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                + Ajouter une action
              </button>
            </div>

            {actions.length === 0 && <p className="text-sm text-slate-400">Aucune action pour l&apos;instant.</p>}

            {actions.map((action, index) => (
              <div key={index} className="rounded-md border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(index, defaultActionFor(e.target.value as AutomationAction['type']))}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    {Object.entries(ACTION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeAction(index)}
                    className="text-xs text-red-600 underline"
                  >
                    Retirer
                  </button>
                </div>

                {action.type === 'CREATE_PROJECT' && (
                  <Field
                    label="Nom du projet"
                    value={action.config.nameTemplate}
                    onChange={(v) => updateAction(index, { type: 'CREATE_PROJECT', config: { nameTemplate: v } })}
                    required={false}
                    placeholder="Projet {{companyName}}"
                  />
                )}

                {action.type === 'CREATE_TASK' && (
                  <div className="space-y-2">
                    <Field
                      label="Titre de la tâche"
                      value={action.config.titleTemplate}
                      onChange={(v) =>
                        updateAction(index, {
                          type: 'CREATE_TASK',
                          config: { ...action.config, titleTemplate: v },
                        })
                      }
                      required={false}
                      placeholder="Brief de lancement — {{companyName}}"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={action.config.useCreatedProject}
                        onChange={(e) =>
                          updateAction(index, {
                            type: 'CREATE_TASK',
                            config: { ...action.config, useCreatedProject: e.target.checked },
                          })
                        }
                      />
                      Rattacher au projet créé par une action précédente de cette règle
                    </label>
                  </div>
                )}

                {action.type === 'SEND_NOTIFICATION' && (
                  <Field
                    label="Message de la notification"
                    value={action.config.titleTemplate}
                    onChange={(v) => updateAction(index, { type: 'SEND_NOTIFICATION', config: { titleTemplate: v } })}
                    required={false}
                    placeholder="Devis {{quoteNumber}} accepté par {{companyName}}"
                  />
                )}
              </div>
            ))}
            <p className="text-xs text-slate-400">
              Variables disponibles dans les textes : {'{{companyName}}'}, {'{{dealTitle}}'}, {'{{quoteNumber}}'},{' '}
              {'{{invoiceNumber}}'}.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || !name}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {submitting ? 'Création...' : 'Créer la règle'}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {rules?.map((rule) => (
          <div key={rule.id} className="rounded-xl border border-border bg-card shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                <p className="text-xs text-slate-500">
                  {TRIGGER_LABELS[rule.trigger]} → {rule.actions.map((a) => ACTION_LABELS[a.type]).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-xs text-slate-600">
                  <input type="checkbox" checked={rule.isActive} onChange={() => toggleActive(rule)} />
                  Active
                </label>
                <button onClick={() => showHistory(rule.id)} className="text-xs text-slate-700 underline">
                  Historique
                </button>
                <button onClick={() => removeRule(rule.id)} className="text-xs text-red-600 underline">
                  Supprimer
                </button>
              </div>
            </div>

            {expandedRule?.id === rule.id && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                {expandedRule.runs.length === 0 && (
                  <p className="text-sm text-slate-400">Cette règle ne s&apos;est encore jamais déclenchée.</p>
                )}
                <ul className="space-y-2">
                  {expandedRule.runs.map((run) => (
                    <li key={run.id} className="rounded-md bg-slate-50 p-2 text-xs">
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${
                            run.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {run.status === 'SUCCESS' ? 'Réussi' : 'Échec'}
                        </span>
                        <span className="text-slate-400">{new Date(run.createdAt).toLocaleString('fr-FR')}</span>
                      </div>
                      <pre className="whitespace-pre-wrap text-slate-600">{run.resultLog}</pre>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {rules?.length === 0 && (
          <p className="rounded-xl border border-border bg-card shadow-sm p-4 text-center text-sm text-slate-400">
            Aucune règle d&apos;automatisation pour l&apos;instant.
          </p>
        )}
      </section>
    </div>
  );
}
