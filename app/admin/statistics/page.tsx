// app/admin/statistics/page.tsx — registration statistics and registration period control
'use client';
import { useState } from 'react';
import { BookOpen, ClipboardCheck, Lock, RotateCcw, Unlock, UserCheck, Users } from 'lucide-react';
import AppShell from '@/components/AppShell';
import RouteGuard from '@/components/RouteGuard';
import { Alert, Badge, Button, Card, CardHeader, Progress, StatCard } from '@/components/ui';
import { formatCode, formatLevel } from '@/lib/format';
import { enrolmentCount } from '@/lib/registration';
import { seedDb, useDatabase } from '@/lib/storage';
import type { Session } from '@/lib/auth';

function Statistics({ session }: { session: Session }) {
  const { db, commit } = useDatabase();
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState('');

  const active = db.registrations.filter(r => r.session === db.session && r.status === 'REGISTERED');
  const registeredStudents = new Set(active.map(r => r.studentId));
  const venues = new Map(db.venues.map(v => [v.venueId, v]));
  const levels = [...new Set(db.students.map(s => s.level))].sort();
  const courses = [...db.courses].sort((a, b) => a.level - b.level || a.courseCode.localeCompare(b.courseCode));

  function toggleRegistration() {
    const open = !db.registrationOpen;
    if (commit({ ...db, registrationOpen: open })) {
      setMessage(open ? 'Registration has been opened.' : 'Registration has been closed.');
    }
  }

  function resetDemo() {
    commit(seedDb());
    setConfirmReset(false);
    setMessage('Demo data has been reset to its original state.');
  }

  return (
    <AppShell session={session} title="Registration Statistics"
      description={`Live enrolment figures for the ${db.session} session.`}
      actions={<>
        {confirmReset
          ? <>
              <Button variant="danger" onClick={resetDemo}>Confirm reset</Button>
              <Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancel</Button>
            </>
          : <Button variant="secondary" onClick={() => setConfirmReset(true)}><RotateCcw className="h-4 w-4" aria-hidden />Reset demo data</Button>}
        <Button variant={db.registrationOpen ? 'danger' : 'primary'} onClick={toggleRegistration}>
          {db.registrationOpen
            ? <><Lock className="h-4 w-4" aria-hidden />Close registration</>
            : <><Unlock className="h-4 w-4" aria-hidden />Open registration</>}
        </Button>
      </>}>
      <div className="space-y-6">
        {message && <Alert tone="success">{message}</Alert>}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard icon={Users} label="Students" value={db.students.length} hint="In the department" />
          <StatCard icon={UserCheck} label="Registered students" value={registeredStudents.size} tone="green"
            hint={`${Math.round((registeredStudents.size / Math.max(1, db.students.length)) * 100)}% of all students`} />
          <StatCard icon={ClipboardCheck} label="Course registrations" value={active.length} tone="violet" hint="Active this session" />
          <StatCard icon={BookOpen} label="Courses offered" value={db.courses.length} tone="amber"
            hint={`${db.courses.filter(c => c.slotId === undefined).length} not yet scheduled`} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {levels.map(level => {
            const total = db.students.filter(s => s.level === level).length;
            const done = db.students.filter(s => s.level === level && registeredStudents.has(s.studentId)).length;
            return (
              <Card key={level} className="p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-slate-900">{formatLevel(level)}</p>
                  <p className="text-xs text-slate-500">{done}/{total} registered</p>
                </div>
                <div className="mt-3"><Progress value={done} max={total} warn={false} /></div>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader title="Enrolment by course" description="Registered students against the capacity of the allocated venue." />
          {/* table on wide screens */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Course</th>
                  <th className="px-3 py-2.5 font-semibold">Level</th>
                  <th className="px-3 py-2.5 font-semibold">Registered</th>
                  <th className="px-3 py-2.5 font-semibold">Venue</th>
                  <th className="px-3 py-2.5 font-semibold">Remaining</th>
                  <th className="w-48 px-5 py-2.5 font-semibold">Venue fill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map(c => {
                  const n = enrolmentCount(db, c.courseCode);
                  const venue = c.venueId === undefined ? undefined : venues.get(c.venueId);
                  return (
                    <tr key={c.courseCode}>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{formatCode(c.courseCode)}</p>
                        <p className="text-xs text-slate-500">{c.title}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{c.level}</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{n}</td>
                      <td className="px-3 py-3 text-slate-700">{venue ? `${venue.name} (${venue.capacity})` : <Badge tone="amber">Not allocated</Badge>}</td>
                      <td className="px-3 py-3 text-slate-700">{venue ? venue.capacity - n : '—'}</td>
                      <td className="px-5 py-3">{venue && <Progress value={n} max={venue.capacity} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* cards on phones */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {courses.map(c => {
              const n = enrolmentCount(db, c.courseCode);
              const venue = c.venueId === undefined ? undefined : venues.get(c.venueId);
              return (
                <li key={c.courseCode} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold text-slate-900">{formatCode(c.courseCode)}</p>
                    <p className="text-sm font-semibold text-slate-900">{n}<span className="font-normal text-slate-500"> / {venue?.capacity ?? '—'}</span></p>
                  </div>
                  <p className="truncate text-xs text-slate-500">{c.title} · {venue?.name ?? 'No venue'}</p>
                  {venue && <div className="mt-2"><Progress value={n} max={venue.capacity} /></div>}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}

export default function StatisticsPage() {
  return <RouteGuard role="admin">{session => <Statistics session={session} />}</RouteGuard>;
}
