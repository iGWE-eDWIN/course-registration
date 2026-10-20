// components/CourseList.tsx — course registration with real-time clash detection
'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, Check, Clock, GraduationCap, Layers, Lock, MapPin, Minus, Plus, Search } from 'lucide-react';
import { compareSlots } from '@/lib/clash';
import { DAY_NAMES, formatCode, formatLevel } from '@/lib/format';
import { dropCourse, registerCourse, registeredCourseCodes } from '@/lib/registration';
import { useDatabase } from '@/lib/storage';
import { Alert, Badge, Button, Card, CardHeader, EmptyState, StatCard, inputClass } from './ui';

interface Notice { courseCode: string; ok: boolean; text: string }

export default function CourseList({ studentId }: { studentId: string }) {
  const { db, commit } = useDatabase();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState('');

  function handleAdd(courseCode: string) {
    const result = registerCourse(db, studentId, courseCode);
    if (result.ok && !commit(result.db)) {
      setNotice({ courseCode, ok: false,
        text: 'Registration could not be saved. Your existing courses are unchanged.' });
      return;
    }
    setNotice({ courseCode, ok: result.ok, text: result.message });
  }

  function handleDrop(courseCode: string) {
    const result = dropCourse(db, studentId, courseCode);
    if (result.ok && !commit(result.db)) {
      setNotice({ courseCode, ok: false, text: 'The change could not be saved. Please try again.' });
      return;
    }
    setNotice({ courseCode, ok: result.ok, text: result.message });
  }

  const student = db.students.find(s => s.studentId === studentId);
  const slots = useMemo(() => new Map(db.timeSlots.map(s => [s.slotId, s])), [db.timeSlots]);
  const venues = useMemo(() => new Map(db.venues.map(v => [v.venueId, v])), [db.venues]);
  if (!student) return null;

  const approved = db.courses
    .filter(c => c.programme === student.programme && c.level === student.level)
    .sort((a, b) => a.courseCode.localeCompare(b.courseCode));
  const registered = new Set(registeredCourseCodes(db, studentId));
  const mine = approved.filter(c => registered.has(c.courseCode))
    .sort((a, b) => compareSlots(slots.get(a.slotId!)!, slots.get(b.slotId!)!));
  const units = mine.reduce((sum, c) => sum + c.unitLoad, 0);
  const q = query.trim().toLowerCase();
  const visible = approved.filter(c => !q || c.courseCode.toLowerCase().includes(q) || c.title.toLowerCase().includes(q));

  const when = (slotId?: number) => {
    const s = slotId === undefined ? undefined : slots.get(slotId);
    return s ? `${DAY_NAMES[s.day]} · ${s.start}–${s.end}` : 'Not yet scheduled';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon={GraduationCap} label="Programme" value={formatLevel(student.level)} hint={student.programme} />
        <StatCard icon={BookOpen} label="Registered courses" value={mine.length} hint={`of ${approved.length} available`} tone="violet" />
        <StatCard icon={Layers} label="Total units" value={units} hint="Credit units this semester" tone="amber" />
        <StatCard icon={db.registrationOpen ? CalendarDays : Lock} label="Registration"
          value={db.registrationOpen ? 'Open' : 'Closed'} hint={`Session ${db.session}`} tone="green" />
      </div>

      {!db.registrationOpen && (
        <Alert tone="warning" title="Registration is closed">
          Course registration for this session has closed. You can still view and print your timetable.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Approved courses"
            description={`${student.programme} · ${formatLevel(student.level)} · ${db.session} session`}
            actions={
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search courses"
                  className={`${inputClass} pl-9`} aria-label="Search courses" />
              </div>
            }
          />
          {visible.length === 0
            ? <EmptyState icon={Search} title="No matching courses">Try a different course code or title.</EmptyState>
            : (
              <ul className="divide-y divide-slate-100">
                {visible.map(course => {
                  const isMine = registered.has(course.courseCode);
                  const venue = course.venueId === undefined ? undefined : venues.get(course.venueId);
                  return (
                    <li key={course.courseCode} className="px-4 py-4 sm:px-5" data-course={course.courseCode}>
                      <div className="flex items-start gap-3">
                        <div className="hidden h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-700 sm:flex">
                          <span className="text-[10px] font-semibold leading-none">{course.courseCode.slice(0, 3)}</span>
                          <span className="text-sm font-bold leading-tight">{course.courseCode.slice(3)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="font-semibold text-slate-900">{formatCode(course.courseCode)}</p>
                            <Badge tone="slate">{course.unitLoad} {course.unitLoad === 1 ? 'unit' : 'units'}</Badge>
                            {isMine && <Badge tone="green"><Check className="h-3 w-3" aria-hidden />Registered</Badge>}
                          </div>
                          <p className="mt-0.5 text-sm text-slate-700">{course.title}</p>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden />{when(course.slotId)}</span>
                            {venue && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{venue.name}</span>}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {isMine
                            ? <Button variant="secondary" size="sm" onClick={() => handleDrop(course.courseCode)} disabled={!db.registrationOpen}>
                                <Minus className="h-3.5 w-3.5" aria-hidden />Drop
                              </Button>
                            : <Button size="sm" onClick={() => handleAdd(course.courseCode)} disabled={!db.registrationOpen}>
                                <Plus className="h-3.5 w-3.5" aria-hidden />Add
                              </Button>}
                        </div>
                      </div>
                      {notice?.courseCode === course.courseCode && (
                        <Alert tone={notice.ok ? 'success' : 'error'} className="mt-3">{notice.text}</Alert>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
        </Card>

        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader title="My registration" description={`${mine.length} courses · ${units} units`} />
          {mine.length === 0
            ? <EmptyState icon={BookOpen} title="No courses yet">Add courses from the list to build your semester.</EmptyState>
            : (
              <ul className="divide-y divide-slate-100">
                {mine.map(c => (
                  <li key={c.courseCode} className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{formatCode(c.courseCode)}</p>
                      <p className="truncate text-xs text-slate-500">{c.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{when(c.slotId)}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-500">{c.unitLoad}u</span>
                  </li>
                ))}
              </ul>
            )}
          <div className="border-t border-slate-200 p-4 sm:px-5">
            <Link href="/student/timetable/"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              <CalendarDays className="h-4 w-4" aria-hidden />View my timetable
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
