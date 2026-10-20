// lib/auth.ts
import type { Database } from './types';

export type Role = 'student' | 'admin';
export interface Session { role: Role; id: string; name: string }

const SESSION_KEY = 'crtms-session';

export async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

export async function login(db: Database, role: Role, id: string,
                            password: string): Promise<Session | null> {
  const hash = await sha256(password);
  if (role === 'student') {
    const s = db.students.find(st => st.studentId.toLowerCase() === id.trim().toLowerCase());
    return s && s.passwordHash === hash ? { role, id: s.studentId, name: s.name } : null;
  }
  const a = db.admins.find(ad => ad.username === id.trim());
  return a && a.passwordHash === hash ? { role, id: a.username, name: 'Administrator' } : null;
}

export function getSession(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  try { window.sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

export function homeFor(role: Role): string {
  return role === 'admin' ? '/admin/statistics/' : '/student/register/';
}
