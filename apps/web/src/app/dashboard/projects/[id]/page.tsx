'use client';

import { useParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { mutate } from 'swr';
import { Badge } from '@/components/badge';
import { Field } from '@/components/form-field';
import { api, ApiError } from '@/lib/api';
import { Project, Task, TaskPriority, TaskStatus } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'À faire' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'IN_REVIEW', label: 'En relecture' },
  { value: 'DONE', label: 'Terminé' },
];

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  URGENT: 'bg-red-100 text-red-700',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const key = `/projects/${id}`;
  const { data: project, error: loadError } = useApi<Omit<Project, 'tasks'> & { tasks: Task[] }>(key);

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function addTask(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/tasks', { projectId: id, title, priority, dueDate: dueDate || undefined });
      setTitle('');
      setPriority('MEDIUM');
      setDueDate('');
      mutate(key);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function updateStatus(taskId: string, status: TaskStatus) {
    setError(null);
    try {
      await api.patch(`/tasks/${taskId}`, { status });
      mutate(key);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  async function updateProjectStatus(status: Project['status']) {
    setError(null);
    try {
      await api.patch(`/projects/${id}`, { status });
      mutate(key);
      mutate('/projects');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }
  }

  if (loadError) return <p className="text-sm text-red-600">Impossible de charger ce projet.</p>;
  if (!project) return <p className="text-sm text-slate-500">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
            {project.company && <span>{project.company.name}</span>}
            {project.dueDate && <span>Échéance : {new Date(project.dueDate).toLocaleDateString('fr-FR')}</span>}
            {project.budget && <span>Budget : {project.budget} €</span>}
          </div>
        </div>
        <select
          value={project.status}
          onChange={(e) => updateProjectStatus(e.target.value as Project['status'])}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'ARCHIVED'].map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={addTask} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="min-w-[200px] flex-1">
          <Field label="Nouvelle tâche" value={title} onChange={setTitle} placeholder="Créer les maquettes" />
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Priorité</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Échéance</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover">
          Ajouter
        </button>
      </form>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((column) => {
          const tasks = project.tasks.filter((t) => t.status === column.value);
          const overdueCount = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date()).length;
          return (
            <div key={column.value} className="w-64 shrink-0 rounded-xl bg-muted p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{column.label}</p>
                <span className="text-xs text-slate-400">{tasks.length}</span>
              </div>
              <div className="space-y-2">
                {tasks.map((task) => {
                  const overdue = task.dueDate && new Date(task.dueDate) < new Date();
                  return (
                    <div key={task.id} className="rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md">
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLOR[task.priority]}`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className={`text-xs ${overdue ? 'font-medium text-red-600' : 'text-slate-500'}`}>
                            {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      <select
                        value={task.status}
                        onChange={(e) => updateStatus(task.id, e.target.value as TaskStatus)}
                        className="mt-2 w-full rounded border border-slate-200 px-1.5 py-1 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
                {tasks.length === 0 && <p className="py-4 text-center text-xs text-slate-400">Aucune tâche</p>}
                {overdueCount > 0 && (
                  <p className="text-center text-xs font-medium text-red-600">{overdueCount} en retard</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
