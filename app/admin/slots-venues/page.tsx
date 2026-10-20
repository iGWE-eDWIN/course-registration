// app/admin/slots-venues/page.tsx — manage time slots and venues
'use client';
import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import RouteGuard from '@/components/RouteGuard';
import { Alert, Button, Card, CardHeader, Field, inputClass } from '@/components/ui';
import { DAYS, compareSlots } from '@/lib/clash';
import { DAY_NAMES } from '@/lib/format';
import { useDatabase } from '@/lib/storage';
import { canDeleteSlot, canDeleteVenue, nextId, validateTimeSlot, validateVenue } from '@/lib/validate';
import type { Session } from '@/lib/auth';
import type { Day } from '@/lib/types';

type Feedback = { ok: boolean; text: string } | null;

function SlotsVenues({ session }: { session: Session }) {
  const { db, commit } = useDatabase();
  const [day, setDay] = useState<Day>('Mon');
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('10:00');
  const [slotFeedback, setSlotFeedback] = useState<Feedback>(null);
  const [venueName, setVenueName] = useState('');
  const [capacity, setCapacity] = useState('60');
  const [venueFeedback, setVenueFeedback] = useState<Feedback>(null);

  const usage = (pred: (c: (typeof db.courses)[number]) => boolean) => db.courses.filter(pred).length;

  function addSlot(e: FormEvent) {
    e.preventDefault();
    const slot = { day, start, end };
    const problem = validateTimeSlot(slot, db);
    if (problem) { setSlotFeedback({ ok: false, text: problem }); return; }
    commit({ ...db, timeSlots: [...db.timeSlots, { slotId: nextId(db.timeSlots.map(s => s.slotId)), ...slot }] });
    setSlotFeedback({ ok: true, text: `${DAY_NAMES[day]} ${start}–${end} was added.` });
  }

  function removeSlot(slotId: number) {
    const problem = canDeleteSlot(slotId, db);
    if (problem) { setSlotFeedback({ ok: false, text: problem }); return; }
    commit({ ...db, timeSlots: db.timeSlots.filter(s => s.slotId !== slotId) });
    setSlotFeedback({ ok: true, text: 'Time slot removed.' });
  }

  function addVenue(e: FormEvent) {
    e.preventDefault();
    const venue = { name: venueName.trim(), capacity: Number(capacity) };
    const problem = validateVenue(venue, db);
    if (problem) { setVenueFeedback({ ok: false, text: problem }); return; }
    commit({ ...db, venues: [...db.venues, { venueId: nextId(db.venues.map(v => v.venueId)), ...venue }] });
    setVenueFeedback({ ok: true, text: `${venue.name} was added.` });
    setVenueName('');
  }

  function removeVenue(venueId: number) {
    const problem = canDeleteVenue(venueId, db);
    if (problem) { setVenueFeedback({ ok: false, text: problem }); return; }
    commit({ ...db, venues: db.venues.filter(v => v.venueId !== venueId) });
    setVenueFeedback({ ok: true, text: 'Venue removed.' });
  }

  return (
    <AppShell session={session} title="Time Slots & Venues"
      description="The periods in which classes can hold, and the rooms available for teaching.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Time slots" description={`${db.timeSlots.length} teaching periods per week`} />
          <form onSubmit={addSlot} className="grid grid-cols-2 gap-3 border-b border-slate-200 p-4 sm:grid-cols-4 sm:items-end sm:px-5">
            <Field label="Day" htmlFor="day">
              <select id="day" value={day} onChange={e => setDay(e.target.value as Day)} className={inputClass}>
                {DAYS.map(d => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
              </select>
            </Field>
            <Field label="Start" htmlFor="start">
              <input id="start" type="time" value={start} onChange={e => setStart(e.target.value)} className={inputClass} />
            </Field>
            <Field label="End" htmlFor="end">
              <input id="end" type="time" value={end} onChange={e => setEnd(e.target.value)} className={inputClass} />
            </Field>
            <Button type="submit"><Plus className="h-4 w-4" aria-hidden />Add slot</Button>
            {slotFeedback && <Alert tone={slotFeedback.ok ? 'success' : 'error'} className="col-span-2 sm:col-span-4">{slotFeedback.text}</Alert>}
          </form>
          <div className="max-h-[32rem] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Day</th>
                  <th className="px-3 py-2.5 font-semibold">Time</th>
                  <th className="px-3 py-2.5 font-semibold">Courses</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...db.timeSlots].sort(compareSlots).map(s => (
                  <tr key={s.slotId}>
                    <td className="px-5 py-2.5 font-medium text-slate-900">{DAY_NAMES[s.day]}</td>
                    <td className="px-3 py-2.5 text-slate-700">{s.start} – {s.end}</td>
                    <td className="px-3 py-2.5 text-slate-700">{usage(c => c.slotId === s.slotId)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => removeSlot(s.slotId)} aria-label="Remove time slot"><Trash2 className="h-4 w-4 text-rose-600" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Venues" description={`${db.venues.length} rooms · ${db.venues.reduce((s, v) => s + v.capacity, 0)} seats in total`} />
          <form onSubmit={addVenue} className="grid grid-cols-2 gap-3 border-b border-slate-200 p-4 sm:grid-cols-4 sm:items-end sm:px-5">
            <div className="col-span-2">
              <Field label="Venue name" htmlFor="venue-name">
                <input id="venue-name" value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="e.g. Faculty Hall C" className={inputClass} />
              </Field>
            </div>
            <Field label="Capacity" htmlFor="capacity">
              <input id="capacity" type="number" min={1} value={capacity} onChange={e => setCapacity(e.target.value)} className={inputClass} />
            </Field>
            <Button type="submit"><Plus className="h-4 w-4" aria-hidden />Add venue</Button>
            {venueFeedback && <Alert tone={venueFeedback.ok ? 'success' : 'error'} className="col-span-2 sm:col-span-4">{venueFeedback.text}</Alert>}
          </form>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Venue</th>
                <th className="px-3 py-2.5 font-semibold">Capacity</th>
                <th className="px-3 py-2.5 font-semibold">Courses</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...db.venues].sort((a, b) => b.capacity - a.capacity).map(v => (
                <tr key={v.venueId}>
                  <td className="px-5 py-2.5 font-medium text-slate-900">{v.name}</td>
                  <td className="px-3 py-2.5 text-slate-700">{v.capacity}</td>
                  <td className="px-3 py-2.5 text-slate-700">{usage(c => c.venueId === v.venueId)}</td>
                  <td className="px-5 py-2.5 text-right">
                    <Button variant="ghost" size="sm" onClick={() => removeVenue(v.venueId)} aria-label={`Remove ${v.name}`}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppShell>
  );
}

export default function SlotsVenuesPage() {
  return <RouteGuard role="admin">{session => <SlotsVenues session={session} />}</RouteGuard>;
}
