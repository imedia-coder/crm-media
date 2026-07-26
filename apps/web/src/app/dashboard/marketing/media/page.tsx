'use client';

import { FormEvent, useRef, useState } from 'react';
import { mutate } from 'swr';
import { api, apiUpload, ApiError } from '@/lib/api';
import { downloadFile } from '@/lib/download';
import { MediaAsset } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function MediaLibraryPage() {
  const { data: assets, isLoading } = useApi<MediaAsset[]>('/marketing/media');
  const [tags, setTags] = useState('');
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
      if (tags) formData.append('tags', tags);
      await apiUpload('/marketing/media', formData);
      setTags('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      mutate('/marketing/media');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setIsUploading(false);
    }
  }

  async function remove(id: string) {
    await api.delete(`/marketing/media/${id}`);
    mutate('/marketing/media');
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Bibliothèque médias</h1>

      <form onSubmit={onUpload} className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card shadow-sm p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Fichier</span>
          <input ref={fileInputRef} type="file" className="text-sm" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Tags (séparés par des virgules)</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="été, promo"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={isUploading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isUploading ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-sm text-slate-400">Chargement...</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {assets?.map((asset) => (
          <div key={asset.id} className="rounded-xl border border-border bg-card shadow-sm p-3">
            <p className="truncate text-sm font-medium text-slate-900">{asset.name}</p>
            <p className="text-xs text-slate-500">{Math.ceil(asset.sizeBytes / 1024)} Ko</p>
            {asset.tags.length > 0 && (
              <p className="mt-1 text-xs text-blue-600">{asset.tags.map((t) => `#${t}`).join(' ')}</p>
            )}
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => downloadFile(`/marketing/media/${asset.id}/download`, asset.name)}
                className="text-xs text-slate-900 underline"
              >
                Télécharger
              </button>
              <button onClick={() => remove(asset.id)} className="text-xs text-red-600 underline">
                Supprimer
              </button>
            </div>
          </div>
        ))}
        {assets?.length === 0 && (
          <p className="col-span-full py-6 text-center text-slate-400">Aucun média pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}
