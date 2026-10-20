// components/RouteGuard.tsx — only lets a logged-in user with the right role see a page
'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, homeFor, type Role, type Session } from '@/lib/auth';
import { useDatabase } from '@/lib/storage';
import { Spinner } from './ui';

export default function RouteGuard({ role, children }: { role: Role; children: (session: Session) => ReactNode }) {
  const router = useRouter();
  const { ready } = useDatabase();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const current = getSession();
    if (!current) router.replace('/');
    else if (current.role !== role) router.replace(homeFor(current.role));
    else setSession(current);
  }, [role, router]);

  if (!session || !ready) return <Spinner />;
  return <>{children(session)}</>;
}
