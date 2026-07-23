'use client';

import { FormEvent, useRef, useState } from 'react';
import { mutate } from 'swr';
import { apiUpload, ApiError } from '@/lib/api';
import { downloadFile } from '@/lib/download';
import { DocumentItem, Project } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function DocumentsPage() {
  const { data: documents, isLoading } = useApi<DocumentItem[]>('/documents');
  const { data: projects } = useApi<Project[]>('/projects');
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Sélectionnez un fichier');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (name) formData.append('name', name);
      if (projectId) formData.append('projectId', projectId);
      await apiUpload('/documents', formData);
      setName('');
      setProjectId('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      mutate('/documents');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Documents</h1>

      <form onSubmit={onUpload} className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Fichier</span>
          <input ref={fileInputRef} type="file" className="text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Nom (optionnel)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Projet</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={isUploading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isUploading ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-sm text-slate-400">Chargement...</p>}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Dernière version</th>
              <th className="px-4 py-2">Taille</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents?.map((doc) => {
              const latest = doc.versions[0];
              return (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{doc.name}</td>
                  <td className="px-4 py-2 text-slate-600">v{latest?.versionNumber ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {latest ? `${Math.ceil(latest.sizeBytes / 1024)} Ko` : '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {latest && (
                      <button
                        onClick={() =>
                          downloadFile(`/documents/${doc.id}/versions/${latest.versionNumber}/download`, latest.originalName)
                        }
                        className="text-sm text-slate-900 underline"
                      >
                        Télécharger
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {documents?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Aucun document pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
