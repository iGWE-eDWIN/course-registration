// lib/timetable.ts
import { compareSlots, overlaps } from './clash';
import type { Course, Registration, TimeSlot, Venue } from './types';

export interface Allocation { courseCode: string; slotId: number; venueId: number }
export interface GenerationResult { allocations: Allocation[]; exceptions: string[] }

export function generateTimetable(courses: Course[], slots: TimeSlot[],
    venues: Venue[], registrations: Registration[]): GenerationResult {
  const slotById = new Map(slots.map(s => [s.slotId, s]));

  // students registered for each course
  const studentsOf = new Map<string, Set<string>>();
  for (const r of registrations) {
    if (r.status !== 'REGISTERED') continue;
    if (!studentsOf.has(r.courseCode)) studentsOf.set(r.courseCode, new Set());
    studentsOf.get(r.courseCode)!.add(r.studentId);
  }
  const shareStudent = (a: string, b: string) =>
    [...(studentsOf.get(a) ?? [])].some(id => studentsOf.get(b)?.has(id));

  // conflict graph: course code -> codes of courses it must not overlap
  const neighbours = new Map(courses.map(c => [c.courseCode, new Set(courses
    .filter(o => o.courseCode !== c.courseCode &&
      ((o.programme === c.programme && o.level === c.level) ||
       shareStudent(c.courseCode, o.courseCode)))
    .map(o => o.courseCode))]));

  // fixed courses first, then most-conflicted first (Welsh & Powell, 1967)
  const order = [...courses].sort((a, b) =>
    Number(b.slotId !== undefined) - Number(a.slotId !== undefined) ||
    neighbours.get(b.courseCode)!.size - neighbours.get(a.courseCode)!.size);

  const placed = new Map<string, Allocation>();
  const exceptions: string[] = [];
  const venuesBySize = [...venues].sort((a, b) => a.capacity - b.capacity);
  const slotsInOrder = [...slots].sort(compareSlots);
  const takenAt = (slot: TimeSlot, test: (a: Allocation) => boolean) =>
    [...placed.values()].some(a => test(a) && overlaps(slotById.get(a.slotId)!, slot));
  // soft constraints: spread a level's classes across the week, then across the day
  const dayLoad = (course: Course, slot: TimeSlot) => [...placed.values()].filter(a =>
    neighbours.get(course.courseCode)!.has(a.courseCode) &&
    slotById.get(a.slotId)!.day === slot.day).length;
  const slotUse = (slot: TimeSlot) =>
    [...placed.values()].filter(a => overlaps(slotById.get(a.slotId)!, slot)).length;

  for (const course of order) {
    const need = Math.max(course.expectedEnrolment,
                          studentsOf.get(course.courseCode)?.size ?? 0);
    const fixed = course.slotId !== undefined;
    const candidates = fixed ? [slotById.get(course.slotId!)!] : [...slotsInOrder].sort((a, b) =>
      dayLoad(course, a) - dayLoad(course, b) || slotUse(a) - slotUse(b));
    let allocation: Allocation | undefined;

    for (const slot of candidates) {
      if (!fixed && takenAt(slot, a => neighbours.get(course.courseCode)!.has(a.courseCode))) {
        continue;                                   // a conflicting course is here
      }
      const venue = venuesBySize.find(v =>
        v.capacity >= need && !takenAt(slot, a => a.venueId === v.venueId));
      if (venue) {
        allocation = { courseCode: course.courseCode, slotId: slot.slotId,
                       venueId: venue.venueId };
        break;
      }
    }
    if (allocation) placed.set(course.courseCode, allocation);
    else exceptions.push(course.courseCode);
  }
  return { allocations: [...placed.values()], exceptions };
}

export function applyAllocations(courses: Course[], result: GenerationResult): Course[] {
  const byCode = new Map(result.allocations.map(a => [a.courseCode, a]));
  return courses.map(c => {
    const a = byCode.get(c.courseCode);
    return a ? { ...c, slotId: a.slotId, venueId: a.venueId } : c;
  });
}
