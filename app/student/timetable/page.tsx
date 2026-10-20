// app/student/timetable/page.tsx — personal timetable
'use client';
import { Printer } from 'lucide-react';
import AppShell from '@/components/AppShell';
import RouteGuard from '@/components/RouteGuard';
import TimetableGrid, { buildEntries } from '@/components/TimetableGrid';
import { Button, Card, CardHeader } from '@/components/ui';
import { compareSlots } from '@/lib/clash';
import { DAY_NAMES, formatCode, formatLevel } from '@/lib/format';
import { registeredCourseCodes } from '@/lib/registration';
import { useDatabase } from '@/lib/storage';
import type { Session } from '@/lib/auth';

function PersonalTimetable({ session }: { session: Session }) {
  const { db } = useDatabase();
  const student = db.students.find(s => s.studentId === session.id)!;
  const codes = new Set(registeredCourseCodes(db, session.id));
  const entries = buildEntries(db.courses.filter(c => codes.has(c.courseCode)), db)
    .sort((a, b) => compareSlots(a.slot, b.slot));
  const units = entries.reduce((sum, e) => sum + e.course.unitLoad, 0);

  return (
    <AppShell session={session} title="My Timetable"
      description={`${student.name} · ${student.studentId} · ${student.programme}, ${formatLevel(student.level)}`}
      actions={<Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden />Print timetable</Button>}>
      <div className="space-y-6">
        <Card>
          <CardHeader title={`Weekly timetable · ${db.session} session`}
            description={`${entries.length} courses · ${units} credit units`} />
          <TimetableGrid entries={entries} slots={db.timeSlots} />
        </Card>

        {entries.length > 0 && (
          <Card className="break-inside-avoid">
            <CardHeader title="Registered courses" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Course</th>
                    <th className="px-3 py-2.5 font-semibold">Title</th>
                    <th className="px-3 py-2.5 font-semibold">Units</th>
                    <th className="px-3 py-2.5 font-semibold">Day &amp; time</th>
                    <th className="px-5 py-2.5 font-semibold">Venue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map(({ course, slot, venue }) => (
                    <tr key={course.courseCode}>
                      <td className="whitespace-nowrap px-5 py-3 font-semibold text-slate-900">{formatCode(course.courseCode)}</td>
                      <td className="px-3 py-3 text-slate-700">{course.title}</td>
                      <td className="px-3 py-3 text-slate-700">{course.unitLoad}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-700">{DAY_NAMES[slot.day]}, {slot.start}–{slot.end}</td>
                      <td className="px-5 py-3 text-slate-700">{venue?.name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

export default function TimetablePage() {
  return <RouteGuard role="student">{session => <PersonalTimetable session={session} />}</RouteGuard>;
}
