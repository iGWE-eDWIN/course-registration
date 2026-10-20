// app/admin/timetable/page.tsx — automatic timetable generation
'use client';
import { useState } from 'react';
import { Printer, Wand2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import RouteGuard from '@/components/RouteGuard';
import TimetableGrid, { buildEntries } from '@/components/TimetableGrid';
import { Alert, Button, Card, CardHeader, cx } from '@/components/ui';
import { formatCode, formatLevel, LEVEL_STYLES } from '@/lib/format';
import { useDatabase } from '@/lib/storage';
import { applyAllocations, generateTimetable } from '@/lib/timetable';
import type { Session } from '@/lib/auth';

interface RunSummary { allocated: number; exceptions: string[]; ms: number }

function Timetable({ session }: { session: Session }) {
  const { db, commit } = useDatabase();
  const [level, setLevel] = useState<number | 'all'>('all');
  const [summary, setSummary] = useState<RunSummary | null>(null);

  const levels = [...new Set(db.courses.map(c => c.level))].sort();
  const shown = db.courses.filter(c => level === 'all' || c.level === level);
  const entries = buildEntries(shown, db);
  const unscheduled = db.courses.filter(c => c.slotId === undefined || c.venueId === undefined);

  function generate() {
    const registrations = db.registrations.filter(r => r.session === db.session);
    const startedAt = performance.now();
    const result = generateTimetable(db.courses, db.timeSlots, db.venues, registrations);
    const ms = performance.now() - startedAt;
    commit({ ...db, courses: applyAllocations(db.courses, result) });
    setSummary({ allocated: result.allocations.length, exceptions: result.exceptions, ms });
  }

  return (
    <AppShell session={session} title="Departmental Timetable"
      description="Generate a clash-free timetable from the course list and validated registrations."
      actions={<>
        <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden />Print</Button>
        <Button onClick={generate}><Wand2 className="h-4 w-4" aria-hidden />Generate timetable</Button>
      </>}>
      <div className="space-y-4">
        {summary && (
          <Alert tone={summary.exceptions.length ? 'warning' : 'success'} title="Timetable generated" className="print:hidden">
            {summary.allocated} of {db.courses.length} courses allocated a time slot and venue in {summary.ms.toFixed(1)} ms.
            {summary.exceptions.length > 0 && (
              <> Could not place: <strong>{summary.exceptions.map(formatCode).join(', ')}</strong>. Add a time slot or a larger venue, then generate again.</>
            )}
          </Alert>
        )}
        {!summary && unscheduled.length > 0 && (
          <Alert tone="info" className="print:hidden">
            {unscheduled.length} course{unscheduled.length === 1 ? ' has' : 's have'} no time slot or venue yet: {unscheduled.map(c => formatCode(c.courseCode)).join(', ')}.
            Select <strong>Generate timetable</strong> to allocate them.
          </Alert>
        )}
        <Card>
          <CardHeader
            title={level === 'all' ? 'All levels' : formatLevel(level)}
            description={`${entries.length} classes · ${db.session} session`}
            actions={
              <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 print:hidden">
                {(['all', ...levels] as const).map(l => (
                  <button key={l} onClick={() => setLevel(l)}
                    className={cx('rounded-md px-3 py-1 text-xs font-semibold transition',
                      level === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                    {l === 'all' ? 'All levels' : l}
                  </button>
                ))}
              </div>
            } />
          <TimetableGrid entries={entries} slots={db.timeSlots} />
          <div className="flex flex-wrap gap-3 border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            {levels.map(l => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className={cx('h-3 w-3 rounded ring-1 ring-inset', LEVEL_STYLES[l])} />{formatLevel(l)}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default function AdminTimetablePage() {
  return <RouteGuard role="admin">{session => <Timetable session={session} />}</RouteGuard>;
}
