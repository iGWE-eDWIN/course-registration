// app/page.tsx — login page
'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck2, Eye, EyeOff, LogIn, ShieldCheck, Smartphone } from 'lucide-react';
import Logo from '@/components/Logo';
import { Alert, Button, Field, cx, inputClass } from '@/components/ui';
import { getSession, homeFor, login, setSession, type Role } from '@/lib/auth';
import { useDatabase } from '@/lib/storage';

const DEMO: Record<Role, { id: string; password: string }> = {
  student: { id: 'CSC/2023/001', password: 'password123' },
  admin: { id: 'admin', password: 'admin123' },
};

const FEATURES = [
  { icon: ShieldCheck, title: 'Real-time clash detection', text: 'Every course you add is checked against your timetable instantly.' },
  { icon: CalendarCheck2, title: 'Automatic timetables', text: 'Departmental timetables are generated from validated registrations.' },
  { icon: Smartphone, title: 'Works on any device', text: 'Register and view your timetable from your phone or computer.' },
];

export default function LoginPage() {
  const router = useRouter();
  const { db, ready } = useDatabase();
  const [role, setRole] = useState<Role>('student');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session) router.replace(homeFor(session.role));
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const session = await login(db, role, id, password);
    setBusy(false);
    if (!session) {
      setError(role === 'student' ? 'Invalid registration number or password.' : 'Invalid username or password.');
      return;
    }
    setSession(session);
    router.replace(homeFor(session.role));
  }

  function switchRole(next: Role) {
    setRole(next);
    setId('');
    setPassword('');
    setError('');
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* brand panel */}
      <div className="relative hidden w-[46%] overflow-hidden bg-brand-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden />
        <div className="relative"><Logo inverted /></div>
        <div className="relative max-w-md">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-300">Department of Computer Science</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-white">
            Course registration without the clashes.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-brand-100/80">
            Register for your courses, see clashes the moment they happen, and get a timetable that just works.
          </p>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-200 ring-1 ring-white/15">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm text-brand-100/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-brand-200/60">{db.session} academic session</p>
      </div>

      {/* sign-in form */}
      <div className="flex flex-1 flex-col">
        <div className="bg-brand-950 px-6 py-8 lg:hidden">
          <Logo inverted />
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">Course registration without the clashes.</h1>
          <p className="mt-2 text-sm text-brand-100/80">Department of Computer Science · {db.session} session</p>
        </div>
        <div className="flex flex-1 items-start justify-center px-6 py-10 lg:items-center">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500">Use your registration number or administrator account.</p>

            <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Account type">
              {(['student', 'admin'] as Role[]).map(r => (
                <button key={r} type="button" role="tab" aria-selected={role === r} onClick={() => switchRole(r)}
                  className={cx('rounded-md py-2 text-sm font-semibold transition',
                    role === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                  {r === 'student' ? 'Student' : 'Administrator'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field label={role === 'student' ? 'Registration number' : 'Username'} htmlFor="login-id">
                <input id="login-id" value={id} onChange={e => setId(e.target.value)} required autoComplete="username"
                  placeholder={role === 'student' ? 'e.g. CSC/2023/001' : 'e.g. admin'} className={inputClass} />
              </Field>
              <Field label="Password" htmlFor="login-password">
                <div className="relative">
                  <input id="login-password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                    className={`${inputClass} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              {error && <Alert tone="error">{error}</Alert>}
              <Button type="submit" className="w-full py-2.5" loading={busy} disabled={!ready}>
                {!busy && <LogIn className="h-4 w-4" aria-hidden />}Sign in
              </Button>
            </form>

            <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo account</p>
              <p className="mt-1.5 text-sm text-slate-700">
                <span className="font-mono">{DEMO[role].id}</span> / <span className="font-mono">{DEMO[role].password}</span>
              </p>
              <button type="button" onClick={() => { setId(DEMO[role].id); setPassword(DEMO[role].password); }}
                className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
                Fill in demo details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
