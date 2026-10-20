// lib/registration.ts
import { findClash } from './clash';
import type { Database, Registration } from './types';

export type RegistrationResult =
  | { ok: true; db: Database; message: string }
  | { ok: false; message: string };

export function registerCourse(db: Database, studentId: string,
                               courseCode: string): RegistrationResult {
  if (!db.registrationOpen) {
    return { ok: false, message: 'Registration for this session is closed.' };
  }
  const slots = new Map(db.timeSlots.map(s => [s.slotId, s]));
  const course = db.courses.find(c => c.courseCode === courseCode);
  const slot = course?.slotId === undefined ? undefined : slots.get(course.slotId);
  if (!course || !slot) {
    return { ok: false, message: `${courseCode} has not been allocated a time slot yet.` };
  }

  const mine = db.registrations.filter(r => r.studentId === studentId &&
    r.session === db.session && r.status === 'REGISTERED');
  if (mine.some(r => r.courseCode === courseCode)) {
    return { ok: false, message: `You are already registered for ${courseCode}.` };
  }

  const myCourses = db.courses.filter(c => mine.some(r => r.courseCode === c.courseCode));
  const clash = findClash(slot, myCourses, slots);
  if (clash) {
    const s = slots.get(clash.slotId!)!;
    return { ok: false, message:
      `Clash found with ${clash.courseCode} (${clash.title}), ${s.day} ${s.start}-${s.end}.` };
  }

  const registration: Registration = { regId: crypto.randomUUID(), studentId,
    courseCode, session: db.session, status: 'REGISTERED' };
  return { ok: true, db: { ...db, registrations: [...db.registrations, registration] },
           message: `${courseCode} registered successfully.` };
}

export function dropCourse(db: Database, studentId: string,
                           courseCode: string): RegistrationResult {
  if (!db.registrationOpen) {
    return { ok: false, message: 'Registration for this session is closed.' };
  }
  const target = db.registrations.find(r => r.studentId === studentId &&
    r.courseCode === courseCode && r.session === db.session && r.status === 'REGISTERED');
  if (!target) {
    return { ok: false, message: `You are not registered for ${courseCode}.` };
  }
  // keep the record (status DROPPED) so registration history is preserved
  const registrations = db.registrations.map(r =>
    r === target ? { ...r, status: 'DROPPED' as const } : r);
  return { ok: true, db: { ...db, registrations }, message: `${courseCode} dropped.` };
}

export function registeredCourseCodes(db: Database, studentId: string): string[] {
  return db.registrations
    .filter(r => r.studentId === studentId && r.session === db.session && r.status === 'REGISTERED')
    .map(r => r.courseCode);
}

export function enrolmentCount(db: Database, courseCode: string): number {
  return db.registrations.filter(r => r.courseCode === courseCode &&
    r.session === db.session && r.status === 'REGISTERED').length;
}
