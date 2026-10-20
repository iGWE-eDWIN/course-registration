// lib/clash.ts
import type { Course, Day, TimeSlot } from './types';

export const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function toMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

export function overlaps(a: TimeSlot, b: TimeSlot): boolean {
  return a.day === b.day &&
         toMinutes(a.start) < toMinutes(b.end) &&
         toMinutes(a.end) > toMinutes(b.start);
}

export function compareSlots(a: TimeSlot, b: TimeSlot): number {
  return DAYS.indexOf(a.day) - DAYS.indexOf(b.day) ||
         toMinutes(a.start) - toMinutes(b.start);
}

export function findClash(requested: TimeSlot, registered: Course[],
                          slots: Map<number, TimeSlot>): Course | undefined {
  return registered.find(course => {
    const slot = course.slotId === undefined ? undefined : slots.get(course.slotId);
    return slot !== undefined && overlaps(requested, slot);
  });
}
