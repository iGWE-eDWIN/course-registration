// components/AppShell.tsx — sidebar layout (drawer on mobile) shared by all signed-in pages
'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3, BookOpen, Building2, CalendarDays, ClipboardList, LogOut, Menu, X, type LucideIcon,
} from 'lucide-react';
import { clearSession, type Session } from '@/lib/auth';
import { useDatabase } from '@/lib/storage';
import Logo from './Logo';
import { Badge, cx } from './ui';

const NAV: Record<Session['role'], { href: string; label: string; icon: LucideIcon }[]> = {
  student: [
    { href: '/student/register/', label: 'Course Registration', icon: ClipboardList },
    { href: '/student/timetable/', label: 'My Timetable', icon: CalendarDays },
  ],
  admin: [
    { href: '/admin/statistics/', label: 'Statistics', icon: BarChart3 },
    { href: '/admin/courses/', label: 'Courses', icon: BookOpen },
    { href: '/admin/slots-venues/', label: 'Time Slots & Venues', icon: Building2 },
    { href: '/admin/timetable/', label: 'Timetable', icon: CalendarDays },
  ],
};

function initials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function AppShell({ session, title, description, actions, children }: {
  session: Session; title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { db } = useDatabase();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  function logout() {
    clearSession();
    router.replace('/');
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-brand-300/80">
        {session.role === 'admin' ? 'Administration' : 'Student'}
      </p>
      {NAV[session.role].map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname === href.slice(0, -1);
        return (
          <Link key={href} href={href}
            className={cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
              active ? 'bg-white/10 text-white' : 'text-brand-100/80 hover:bg-white/5 hover:text-white')}>
            <Icon className="h-[18px] w-[18px]" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const userCard = (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
          {initials(session.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{session.name}</p>
          <p className="truncate text-xs text-brand-200/80">{session.id}</p>
        </div>
        <button onClick={logout} className="rounded-lg p-2 text-brand-200 hover:bg-white/10 hover:text-white" aria-label="Sign out" title="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-950 lg:flex print:hidden">
        <div className="px-5 py-5"><Logo inverted /></div>
        {nav}
        {userCard}
      </aside>

      {/* mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMenuOpen(false)} aria-hidden />
          <aside className="relative flex h-full w-72 max-w-[85%] flex-col bg-brand-950 shadow-xl">
            <div className="flex items-center justify-between px-5 py-5">
              <Logo inverted />
              <button onClick={() => setMenuOpen(false)} className="rounded-lg p-1.5 text-brand-200 hover:bg-white/10" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {userCard}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button onClick={() => setMenuOpen(true)} className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden"><Logo compact /></div>
            <div className="ml-auto flex items-center gap-2">
              <Badge tone="slate" className="hidden sm:inline-flex">Session {db.session}</Badge>
              {db.registrationOpen
                ? <Badge tone="green"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Registration open</Badge>
                : <Badge tone="red"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />Registration closed</Badge>}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
              {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2 print:hidden">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
