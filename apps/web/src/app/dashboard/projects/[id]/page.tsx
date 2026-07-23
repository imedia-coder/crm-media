'use client';

import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Badge } from '@/components/badge';
import { Field } from '@/components/form-field';
import { api, ApiError } from '@/lib/api';
import { Project, Task, TaskStatus } from '@/lib/types';

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<(Project & { tasks: Task[] }) | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await api.get<Project & { tasks: Task[] }>(`/projects/${id}`);
    setProject(data);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof ApiError ? err.message : 'Erreur de chargement'));
  }, [id]);

  async function addTask(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/tasks', { projectId: id, title });
      setTitle('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function updateStatus(taskId: string, status: TaskStatus) {
    setError(null);
    try {
      await api.patch(`/tasks/${taskId}`, { status });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  if (!project) return <p className="text-sm text-slate-500">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{project.name}</h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
          <Badge value={project.status} />
          {project.company && <span>— {project.company.name}</span>}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Tâches</h2>

        <form onSubmit={addTask} className="mb-4 flex items-end gap-3">
          <div className="flex-1">
            <Field label="Nouvelle tâche" value={title} onChange={setTitle} placeholder="Créer les maquettes" />
          </div>
          <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Ajouter
          </button>
        </form>

        <div className="divide-y divide-slate-100">
          {project.tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-900">{task.title}</span>
              <select
                value={task.status}
                onChange={(e) => updateStatus(task.id, e.target.value as TaskStatus)}
                className="rounded border border-slate-200 px-2 py-1 text-xs"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {project.tasks.length === 0 && <p className="py-4 text-center text-slate-400">Aucune tâche.</p>}
        </div>
      </section>
    </div>
  );
}
