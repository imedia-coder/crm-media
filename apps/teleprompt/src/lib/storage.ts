import { idbDelete, idbGet, idbGetAll, idbGetAllByIndex, idbPut, STORES } from "./db";
import {
  DEFAULT_SETTINGS,
  MAX_VERSIONS_PER_SCRIPT,
  PrompterSession,
  Recording,
  Script,
  ScriptSettings,
  ScriptVersion,
} from "./types";

function uid(): string {
  return crypto.randomUUID();
}

export async function listScripts(): Promise<Script[]> {
  const scripts = await idbGetAll<Script>(STORES.scripts);
  return scripts.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getScript(id: string): Promise<Script | undefined> {
  return idbGet<Script>(STORES.scripts, id);
}

export async function createScript(partial: Partial<Script> = {}): Promise<Script> {
  const now = Date.now();
  const script: Script = {
    id: uid(),
    title: partial.title ?? "Sans titre",
    content: partial.content ?? "",
    language: partial.language ?? "fr",
    category: partial.category ?? "",
    notes: partial.notes ?? "",
    wordsPerMinute: partial.wordsPerMinute ?? 150,
    createdAt: now,
    updatedAt: now,
  };
  await idbPut(STORES.scripts, script);
  await idbPut(STORES.settings, { ...DEFAULT_SETTINGS, scriptId: script.id });
  return script;
}

export async function saveScript(script: Script): Promise<void> {
  await idbPut(STORES.scripts, { ...script, updatedAt: Date.now() });
}

export async function deleteScript(id: string): Promise<void> {
  await idbDelete(STORES.scripts, id);
  await idbDelete(STORES.settings, id);
  await idbDelete(STORES.sessions, id);
  const versions = await idbGetAllByIndex<ScriptVersion>(STORES.scriptVersions, "scriptId", id);
  await Promise.all(versions.map((v) => idbDelete(STORES.scriptVersions, v.id)));
}

export async function getSettings(scriptId: string): Promise<ScriptSettings> {
  const found = await idbGet<ScriptSettings>(STORES.settings, scriptId);
  return found ?? { ...DEFAULT_SETTINGS, scriptId };
}

export async function saveSettings(settings: ScriptSettings): Promise<void> {
  await idbPut(STORES.settings, settings);
}

export async function getSession(scriptId: string): Promise<PrompterSession | undefined> {
  return idbGet<PrompterSession>(STORES.sessions, scriptId);
}

export async function saveSession(session: PrompterSession): Promise<void> {
  await idbPut(STORES.sessions, session);
}

export async function clearSession(scriptId: string): Promise<void> {
  await idbDelete(STORES.sessions, scriptId);
}

export async function listRecordings(): Promise<Recording[]> {
  const recordings = await idbGetAll<Recording>(STORES.recordings);
  return recordings.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveRecording(
  meta: Omit<Recording, "id" | "createdAt">,
  blob: Blob,
): Promise<Recording> {
  const recording: Recording = { ...meta, id: uid(), createdAt: Date.now() };
  await idbPut(STORES.recordings, recording);
  await idbPut(STORES.recordingBlobs, blob, recording.id);
  return recording;
}

export async function getRecordingBlob(id: string): Promise<Blob | undefined> {
  return idbGet<Blob>(STORES.recordingBlobs, id);
}

export async function renameRecording(id: string, title: string): Promise<void> {
  const recording = await idbGet<Recording>(STORES.recordings, id);
  if (!recording) return;
  await idbPut(STORES.recordings, { ...recording, title });
}

export async function deleteRecording(id: string): Promise<void> {
  await idbDelete(STORES.recordings, id);
  await idbDelete(STORES.recordingBlobs, id);
}

export async function listVersions(scriptId: string): Promise<ScriptVersion[]> {
  const versions = await idbGetAllByIndex<ScriptVersion>(STORES.scriptVersions, "scriptId", scriptId);
  return versions.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveVersion(script: Pick<Script, "id" | "title" | "content">): Promise<void> {
  const version: ScriptVersion = {
    id: uid(),
    scriptId: script.id,
    title: script.title,
    content: script.content,
    createdAt: Date.now(),
  };
  await idbPut(STORES.scriptVersions, version);

  const versions = await listVersions(script.id);
  const excess = versions.slice(MAX_VERSIONS_PER_SCRIPT);
  await Promise.all(excess.map((v) => idbDelete(STORES.scriptVersions, v.id)));
}
