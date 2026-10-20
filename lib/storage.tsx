// lib/storage.tsx
'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import seed from '@/data/seed.json';
import type { Database } from './types';

const KEY = 'crtms-db-v1';

export function seedDb(): Database {
  return structuredClone(seed as Database);
}

export function loadDb(): Database {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Database;
  } catch {
    // storage unavailable or unreadable: fall back to the seed data
  }
  return seedDb();
}

export function saveDb(db: Database): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
    return true;
  } catch {
    return false;             // e.g. storage full or blocked
  }
}

interface DatabaseContextValue {
  db: Database;
  ready: boolean;             // true once the saved data has been loaded
  commit: (next: Database) => boolean;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(seedDb);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDb(loadDb());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setDb(loadDb());     // changed in another tab
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function commit(next: Database): boolean {
    if (!saveDb(next)) return false;
    setDb(next);
    return true;
  }

  return <DatabaseContext.Provider value={{ db, ready, commit }}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  if (!context) throw new Error('useDatabase() must be used inside <DatabaseProvider>');
  return context;
}
