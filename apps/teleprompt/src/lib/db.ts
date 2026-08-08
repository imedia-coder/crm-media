const DB_NAME = "teleprompt";
const DB_VERSION = 2;

export const STORES = {
  scripts: "scripts",
  settings: "settings",
  sessions: "sessions",
  recordings: "recordings",
  recordingBlobs: "recordingBlobs",
  scriptVersions: "scriptVersions",
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORES.scripts)) {
          db.createObjectStore(STORES.scripts, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.settings)) {
          db.createObjectStore(STORES.settings, { keyPath: "scriptId" });
        }
        if (!db.objectStoreNames.contains(STORES.sessions)) {
          db.createObjectStore(STORES.sessions, { keyPath: "scriptId" });
        }
        if (!db.objectStoreNames.contains(STORES.recordings)) {
          db.createObjectStore(STORES.recordings, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.recordingBlobs)) {
          db.createObjectStore(STORES.recordingBlobs);
        }
        if (!db.objectStoreNames.contains(STORES.scriptVersions)) {
          const store = db.createObjectStore(STORES.scriptVersions, { keyPath: "id" });
          store.createIndex("scriptId", "scriptId");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

export async function idbGet<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGetAll<T>(store: string): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGetAllByIndex<T>(
  store: string,
  indexName: string,
  key: IDBValidKey,
): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).index(indexName).getAll(key);
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPut(store: string, value: unknown, key?: IDBValidKey): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function idbDelete(store: string, key: IDBValidKey): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
