// components/TimetableGrid.tsx — weekly grid on wide screens and in print, day cards on phones
import { CalendarX2, MapPin } from 'lucide-react';
import { DAYS, compareSlots, toMinutes } from '@/lib/clash';
import { DAY_NAMES, LEVEL_STYLES, formatCode } from '@/lib/format';
import type { Course, Database, TimeSlot, Venue } from '@/lib/types';
import { EmptyState, cx } from './ui';

export interface TimetableEntry { course: Course; slot: TimeSlot; venue?: Venue }

export function buildEntries(courses: Course[], db: Database): TimetableEntry[] {
  const slots = new Map(db.timeSlots.map(s => [s.slotId, s]));
  const venues = new Map(db.venues.map(v => [v.venueId, v]));
  return courses.flatMap(course => {
    const slot = course.slotId === undefined ? undefined : slots.get(course.slotId);
    if (!slot) return [];
    return [{ course, slot, venue: course.venueId === undefined ? undefined : venues.get(course.venueId) }];
  });
}

function periodsOf(slots: TimeSlot[]): { start: string; end: string }[] {
  const seen = new Map<string, { start: string; end: string }>();
  for (const s of slots) seen.set(`${s.start}-${s.end}`, { start: s.start, end: s.end });
  return [...seen.values()].sort((a, b) => toMinutes(a.start) - toMinutes(b.start) || toMinutes(a.end) - toMinutes(b.end));
}

function Entry({ entry, dense }: { entry: TimetableEntry; dense?: boolean }) {
  const { course, venue } = entry;
  return (
    <div className={cx('rounded-lg px-2 py-1.5 ring-1 ring-inset', LEVEL_STYLES[course.level] ?? LEVEL_STYLES[100])}>
      <p className="text-xs font-bold">{formatCode(course.courseCode)}</p>
      <p className={cx('text-[11px] leading-snug', dense && 'line-clamp-2')}>{course.title}</p>
      {venue && (
        <p className="mt-0.5 flex items-center gap-1 text-[11px] opacity-80">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{venue.name}</span>
        </p>
      )}
    </div>
  );
}

export default function TimetableGrid({ entries, slots }: { entries: TimetableEntry[]; slots: TimeSlot[] }) {
  if (entries.length === 0) {
    return <EmptyState icon={CalendarX2} title="No classes to show">Registered courses will appear here.</EmptyState>;
  }
  const periods = periodsOf(slots);
  const at = (day: string, start: string, end: string) =>
    entries.filter(e => e.slot.day === day && e.slot.start === start && e.slot.end === end);

  return (
    <>
      {/* wide screens and print */}
      <div className="hidden overflow-x-auto md:block print:block">
        <table className="w-full min-w-[720px] table-fixed border-collapse text-left">
          <thead>
            <tr>
              <th className="w-28 border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Day</th>
              {periods.map(p => (
                <th key={`${p.start}-${p.end}`} className="border-b border-l border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600">
                  {p.start} – {p.end}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day} className="align-top">
                <th className="border-b border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800">{DAY_NAMES[day]}</th>
                {periods.map(p => (
                  <td key={`${p.start}-${p.end}`} className="border-b border-l border-slate-200 p-1.5">
                    <div className="flex min-h-[3.5rem] flex-col gap-1.5">
                      {at(day, p.start, p.end).map(e => <Entry key={e.course.courseCode} entry={e} dense />)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* phones */}
      <div className="space-y-3 p-3 md:hidden print:hidden">
        {DAYS.map(day => {
          const today = entries.filter(e => e.slot.day === day).sort((a, b) => compareSlots(a.slot, b.slot));
          return (
            <section key={day} className="rounded-xl border border-slate-200">
              <h3 className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                {DAY_NAMES[day]}
                <span className="text-xs font-normal text-slate-500">{today.length} {today.length === 1 ? 'class' : 'classes'}</span>
              </h3>
              {today.length === 0
                ? <p className="px-3 py-3 text-sm text-slate-400">No classes</p>
                : (
                  <ul className="divide-y divide-slate-100">
                    {today.map(e => (
                      <li key={e.course.courseCode} className="flex gap-3 px-3 py-2.5">
                        <div className="w-14 shrink-0 text-xs font-semibold text-slate-600">
                          {e.slot.start}<br /><span className="font-normal text-slate-400">{e.slot.end}</span>
                        </div>
                        <div className="min-w-0 flex-1"><Entry entry={e} /></div>
                      </li>
                    ))}
                  </ul>
                )}
            </section>
          );
        })}
      </div>
    </>
  );
}
