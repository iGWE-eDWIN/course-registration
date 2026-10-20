// lib/validate.ts
import { toMinutes } from './clash';
import type { Course, Database, TimeSlot, Venue } from './types';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const COURSE_CODE = /^[A-Z]{3}\d{3}$/;

export function validateCourse(course: Course, db: Database, original?: Course): string | null {
  if (!COURSE_CODE.test(course.courseCode)) return 'Course code must be three letters followed by three digits, e.g. CSC301.';
  if (course.courseCode !== original?.courseCode && db.courses.some(c => c.courseCode === course.courseCode)) {
    return `A course with code ${course.courseCode} already exists.`;
  }
  if (!course.title.trim()) return 'Course title is required.';
  if (!Number.isInteger(course.unitLoad) || course.unitLoad < 1 || course.unitLoad > 6) return 'Unit load must be a whole number from 1 to 6.';
  if (![100, 200, 300, 400, 500].includes(course.level)) return 'Level must be 100, 200, 300, 400 or 500.';
  if (!Number.isInteger(course.expectedEnrolment) || course.expectedEnrolment < 1) return 'Expected enrolment must be at least 1.';
  if (original && original.slotId !== course.slotId &&
      db.registrations.some(r => r.courseCode === original.courseCode && r.session === db.session && r.status === 'REGISTERED')) {
    return 'The time slot of a course cannot be changed once students have registered for it.';
  }
  return null;
}

export function validateTimeSlot(slot: Omit<TimeSlot, 'slotId'>, db: Database): string | null {
  if (!TIME.test(slot.start) || !TIME.test(slot.end)) return 'Times must be in 24-hour HH:MM format.';
  if (toMinutes(slot.start) >= toMinutes(slot.end)) return 'End time must be later than start time.';
  if (db.timeSlots.some(s => s.day === slot.day && s.start === slot.start && s.end === slot.end)) {
    return 'This time slot already exists.';
  }
  return null;
}

export function validateVenue(venue: Omit<Venue, 'venueId'>, db: Database): string | null {
  if (!venue.name.trim()) return 'Venue name is required.';
  if (db.venues.some(v => v.name.toLowerCase() === venue.name.trim().toLowerCase())) return 'A venue with this name already exists.';
  if (!Number.isInteger(venue.capacity) || venue.capacity <= 0) return 'Capacity must be a whole number greater than zero.';
  return null;
}

export function canDeleteCourse(courseCode: string, db: Database): string | null {
  return db.registrations.some(r => r.courseCode === courseCode)
    ? 'This course has registration records and cannot be deleted.'
    : null;
}

export function canDeleteSlot(slotId: number, db: Database): string | null {
  return db.courses.some(c => c.slotId === slotId) ? 'This time slot is in use by a course.' : null;
}

export function canDeleteVenue(venueId: number, db: Database): string | null {
  return db.courses.some(c => c.venueId === venueId) ? 'This venue is in use by a course.' : null;
}

export function nextId(ids: number[]): number {
  return ids.length ? Math.max(...ids) + 1 : 1;
}
