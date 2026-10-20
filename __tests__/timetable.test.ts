// __tests__/timetable.test.ts
import { overlaps } from '@/lib/clash';
import { seedDb } from '@/lib/storage';
import { generateTimetable } from '@/lib/timetable';
import type { Course } from '@/lib/types';

function unscheduled(): Course[] {
  return seedDb().courses.map(({ slotId: _s, venueId: _v, ...c }) => c);
}

test('TC11: generated timetable has no level or venue clashes', () => {
  const db = seedDb();
  const { allocations, exceptions } = generateTimetable(unscheduled(), db.timeSlots, db.venues, []);
  expect(exceptions).toEqual([]);
  const slot = (id: number) => db.timeSlots.find(s => s.slotId === id)!;
  const level = (code: string) => db.courses.find(c => c.courseCode === code)!.level;
  for (const a of allocations) {
    for (const b of allocations) {
      if (a === b || !overlaps(slot(a.slotId), slot(b.slotId))) continue;
      expect(a.venueId).not.toBe(b.venueId);
      expect(level(a.courseCode)).not.toBe(level(b.courseCode));
    }
  }
});

test('venues are large enough for the expected enrolment', () => {
  const db = seedDb();
  const { allocations } = generateTimetable(unscheduled(), db.timeSlots, db.venues, []);
  for (const a of allocations) {
    const course = db.courses.find(c => c.courseCode === a.courseCode)!;
    expect(db.venues.find(v => v.venueId === a.venueId)!.capacity).toBeGreaterThanOrEqual(course.expectedEnrolment);
  }
});

test('courses that already have a slot keep it', () => {
  const db = seedDb();
  const { allocations } = generateTimetable(db.courses, db.timeSlots, db.venues, db.registrations);
  for (const a of allocations) {
    expect(a.slotId).toBe(db.courses.find(c => c.courseCode === a.courseCode)!.slotId);
  }
});

test('a course that cannot be placed is reported, not forced into a clash', () => {
  const db = seedDb();
  const oneSlot = db.timeSlots.slice(0, 1);
  const twoCourses = unscheduled().filter(c => c.level === 300).slice(0, 2);
  const { allocations, exceptions } = generateTimetable(twoCourses, oneSlot, db.venues, []);
  expect(allocations).toHaveLength(1);
  expect(exceptions).toHaveLength(1);
});
