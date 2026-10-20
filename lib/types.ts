// lib/types.ts
export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

export interface Student {
  studentId: string;          // registration number
  name: string;
  programme: string;
  level: number;
  passwordHash: string;
}

export interface TimeSlot {
  slotId: number;
  day: Day;
  start: string;              // 24-hour "HH:MM"
  end: string;
}

export interface Venue {
  venueId: number;
  name: string;
  capacity: number;
}

export interface Course {
  courseCode: string;
  title: string;
  unitLoad: number;
  level: number;
  programme: string;
  expectedEnrolment: number;
  slotId?: number;            // empty until a slot is allocated
  venueId?: number;
}

export interface Registration {
  regId: string;
  studentId: string;
  courseCode: string;
  session: string;            // e.g. "2025/2026"
  status: 'REGISTERED' | 'DROPPED';
}

export interface Admin {
  username: string;
  passwordHash: string;
}

export interface Database {
  session: string;
  registrationOpen: boolean;
  students: Student[];
  admins: Admin[];
  courses: Course[];
  timeSlots: TimeSlot[];
  venues: Venue[];
  registrations: Registration[];
}
