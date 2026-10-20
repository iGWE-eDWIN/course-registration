// app/admin/courses/page.tsx — create, edit and remove courses
'use client';
import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import RouteGuard from '@/components/RouteGuard';
import { Alert, Badge, Button, Card, CardHeader, Field, cx, inputClass } from '@/components/ui';
import { compareSlots } from '@/lib/clash';
import { DAY_NAMES, LEVEL_STYLES, formatCode } from '@/lib/format';
import { enrolmentCount } from '@/lib/registration';
import { useDatabase } from '@/lib/storage';
import { canDeleteCourse, validateCourse } from '@/lib/validate';
import type { Session } from '@/lib/auth';
import type { Course } from '@/lib/types';

const LEVELS = [100, 200, 300, 400];

interface Draft {
  courseCode: string; title: string; unitLoad: string; level: string;
  expectedEnrolment: string; slotId: string; venueId: string;
}

const EMPTY: Draft = { courseCode: '', title: '', unitLoad: '3', level: '100', expectedEnrolment: '50', slotId: '', venueId: '' };

function toDraft(c: Course): Draft {
  return {
    courseCode: c.courseCode, title: c.title, unitLoad: String(c.unitLoad), level: String(c.level),
    expectedEnrolment: String(c.expectedEnrolment), slotId: c.slotId?.toString() ?? '', venueId: c.venueId?.toString() ?? '',
  };
}

function Courses({ session }: { session: Session }) {
  const { db, commit } = useDatabase();
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [editing, setEditing] = useState<Course | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<Course | null>(null);
  const [message, setMessage] = useState('');

  const slots = new Map(db.timeSlots.map(s => [s.slotId, s]));
  const venues = new Map(db.venues.map(v => [v.venueId, v]));
  const sortedSlots = [...db.timeSlots].sort(compareSlots);
  const courses = db.courses
    .filter(c => filter === 'all' || c.level === filter)
    .sort((a, b) => a.level - b.level || a.courseCode.localeCompare(b.courseCode));

  const slotLabel = (id?: number) => {
    const s = id === undefined ? undefined : slots.get(id);
    return s ? `${s.day} ${s.start}–${s.end}` : undefined;
  };

  function openForm(course: Course | null) {
    setEditing(course);
    setDraft(course ? toDraft(course) : EMPTY);
    setError('');
    setFormOpen(true);
  }

  function save(e: FormEvent) {
    e.preventDefault();
    const course: Course = {
      courseCode: draft.courseCode.trim().toUpperCase().replace(/\s+/g, ''),
      title: draft.title.trim(),
      unitLoad: Number(draft.unitLoad),
      level: Number(draft.level),
      programme: editing?.programme ?? 'Computer Science',
      expectedEnrolment: Number(draft.expectedEnrolment),
      ...(draft.slotId ? { slotId: Number(draft.slotId) } : {}),
      ...(draft.venueId ? { venueId: Number(draft.venueId) } : {}),
    };
    const problem = validateCourse(course, db, editing ?? undefined);
    if (problem) { setError(problem); return; }
    const next = editing
      ? db.courses.map(c => (c.courseCode === editing.courseCode ? course : c))
      : [...db.courses, course];
    if (!commit({ ...db, courses: next })) { setError('The course could not be saved.'); return; }
    setFormOpen(false);
    setMessage(editing ? `${formatCode(course.courseCode)} was updated.` : `${formatCode(course.courseCode)} was added.`);
  }

  function confirmDelete() {
    if (!deleting) return;
    const problem = canDeleteCourse(deleting.courseCode, db);
    if (problem) { setMessage(''); setError(problem); return; }
    commit({ ...db, courses: db.courses.filter(c => c.courseCode !== deleting.courseCode) });
    setMessage(`${formatCode(deleting.courseCode)} was deleted.`);
    setDeleting(null);
  }

  const set = (key: keyof Draft) => (e: { target: { value: string } }) => setDraft(d => ({ ...d, [key]: e.target.value }));

  return (
    <AppShell session={session} title="Courses"
      description="Manage the courses offered by the department, their time slots and venues."
      actions={<Button onClick={() => openForm(null)}><Plus className="h-4 w-4" aria-hidden />Add course</Button>}>
      <div className="space-y-4">
        {message && <Alert tone="success">{message}</Alert>}
        <Card>
          <CardHeader title={`${courses.length} courses`}
            actions={
              <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
                {(['all', ...LEVELS] as const).map(l => (
                  <button key={l} onClick={() => setFilter(l)}
                    className={cx('rounded-md px-3 py-1 text-xs font-semibold transition',
                      filter === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                    {l === 'all' ? 'All levels' : l}
                  </button>
                ))}
              </div>
            } />
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Course</th>
                  <th className="px-3 py-2.5 font-semibold">Level</th>
                  <th className="px-3 py-2.5 font-semibold">Units</th>
                  <th className="px-3 py-2.5 font-semibold">Time slot</th>
                  <th className="px-3 py-2.5 font-semibold">Venue</th>
                  <th className="px-3 py-2.5 font-semibold">Registered</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map(c => (
                  <tr key={c.courseCode} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">{formatCode(c.courseCode)}</p>
                      <p className="text-xs text-slate-500">{c.title}</p>
                    </td>
                    <td className="px-3 py-3"><span className={cx('rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', LEVEL_STYLES[c.level])}>{c.level}</span></td>
                    <td className="px-3 py-3 text-slate-700">{c.unitLoad}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-700">{slotLabel(c.slotId) ?? <Badge tone="amber">Not allocated</Badge>}</td>
                    <td className="px-3 py-3 text-slate-700">{(c.venueId !== undefined && venues.get(c.venueId)?.name) || <Badge tone="amber">Not allocated</Badge>}</td>
                    <td className="px-3 py-3 text-slate-700">{enrolmentCount(db, c.courseCode)} <span className="text-slate-400">/ {c.expectedEnrolment}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openForm(c)} aria-label={`Edit ${c.courseCode}`}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setError(''); setDeleting(c); }} aria-label={`Delete ${c.courseCode}`}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-slate-100 md:hidden">
            {courses.map(c => (
              <li key={c.courseCode} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{formatCode(c.courseCode)}</p>
                    <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', LEVEL_STYLES[c.level])}>{c.level}</span>
                  </div>
                  <p className="truncate text-sm text-slate-600">{c.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {slotLabel(c.slotId) ?? 'Not allocated'} · {(c.venueId !== undefined && venues.get(c.venueId)?.name) || 'No venue'} · {enrolmentCount(db, c.courseCode)} registered
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openForm(c)} aria-label={`Edit ${c.courseCode}`}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => { setError(''); setDeleting(c); }} aria-label={`Delete ${c.courseCode}`}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${formatCode(editing.courseCode)}` : 'Add course'}
        description="Leave the time slot and venue empty to have them allocated by the timetable generator."
        footer={<>
          <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button type="submit" form="course-form">Save course</Button>
        </>}>
        <form id="course-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Course code" htmlFor="code">
            <input id="code" value={draft.courseCode} onChange={set('courseCode')} placeholder="e.g. CSC315"
              disabled={!!editing} className={inputClass} required />
          </Field>
          <Field label="Level" htmlFor="level">
            <select id="level" value={draft.level} onChange={set('level')} className={inputClass}>
              {LEVELS.map(l => <option key={l} value={l}>{l} Level</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Title" htmlFor="title">
              <input id="title" value={draft.title} onChange={set('title')} className={inputClass} required />
            </Field>
          </div>
          <Field label="Unit load" htmlFor="units">
            <input id="units" type="number" min={1} max={6} value={draft.unitLoad} onChange={set('unitLoad')} className={inputClass} />
          </Field>
          <Field label="Expected enrolment" htmlFor="expected">
            <input id="expected" type="number" min={1} value={draft.expectedEnrolment} onChange={set('expectedEnrolment')} className={inputClass} />
          </Field>
          <Field label="Time slot" htmlFor="slot">
            <select id="slot" value={draft.slotId} onChange={set('slotId')} className={inputClass}>
              <option value="">Allocate automatically</option>
              {sortedSlots.map(s => <option key={s.slotId} value={s.slotId}>{DAY_NAMES[s.day]} {s.start}–{s.end}</option>)}
            </select>
          </Field>
          <Field label="Venue" htmlFor="venue">
            <select id="venue" value={draft.venueId} onChange={set('venueId')} className={inputClass}>
              <option value="">Allocate automatically</option>
              {db.venues.map(v => <option key={v.venueId} value={v.venueId}>{v.name} ({v.capacity})</option>)}
            </select>
          </Field>
          {error && <div className="sm:col-span-2"><Alert tone="error">{error}</Alert></div>}
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)}
        title={`Delete ${deleting ? formatCode(deleting.courseCode) : ''}?`}
        footer={<>
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete course</Button>
        </>}>
        <p className="text-sm text-slate-600">
          {deleting?.title} will be removed from the course list. Courses that already have registration records cannot be deleted.
        </p>
        {error && <Alert tone="error" className="mt-3">{error}</Alert>}
      </Modal>
    </AppShell>
  );
}

export default function CoursesPage() {
  return <RouteGuard role="admin">{session => <Courses session={session} />}</RouteGuard>;
}
