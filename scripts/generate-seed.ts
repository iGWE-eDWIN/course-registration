// scripts/generate-seed.ts
// Builds data/seed.json: the demo department's courses, time slots, venues,
// accounts and registrations. Slots are allocated with the real timetable
// generator and registrations go through registerCourse(), so the seed data
// contains no clashes. Run with: npm run seed
import { writeFileSync } from 'node:fs';
import { sha256 } from '../lib/auth';
import { DAYS } from '../lib/clash';
import { registerCourse } from '../lib/registration';
import { applyAllocations, generateTimetable } from '../lib/timetable';
import type { Course, Database, Student, TimeSlot, Venue } from '../lib/types';

const PROGRAMME = 'Computer Science';
const SESSION = '2025/2026';
const STUDENTS_PER_LEVEL = 40;

// deterministic pseudo-random numbers so the seed is reproducible
let state = 20252026;
function random(): number {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(items: T[]): T => items[Math.floor(random() * items.length)];

const PERIODS: [string, string][] = [['08:00', '10:00'], ['10:00', '12:00'], ['12:00', '14:00'], ['14:00', '16:00'], ['16:00', '18:00']];
const timeSlots: TimeSlot[] = DAYS.flatMap((day, d) =>
  PERIODS.map(([start, end], p) => ({ slotId: d * PERIODS.length + p + 1, day, start, end })));
const slotAt = (day: string, start: string) => timeSlots.find(s => s.day === day && s.start === start)!.slotId;

const venues: Venue[] = [
  { venueId: 1, name: 'Lecture Theatre 1', capacity: 250 },
  { venueId: 2, name: 'Lecture Theatre 2', capacity: 120 },
  { venueId: 3, name: 'Faculty Hall A', capacity: 60 },
  { venueId: 4, name: 'Faculty Hall B', capacity: 60 },
  { venueId: 5, name: 'Computer Lab 1', capacity: 50 },
  { venueId: 6, name: 'Computer Lab 2', capacity: 40 },
];

type C = [code: string, title: string, units: number, level: number, expected: number, elective?: boolean];
const COURSES: C[] = [
  ['CSC101', 'Introduction to Computer Science', 3, 100, 110],
  ['MTH101', 'Elementary Mathematics I', 3, 100, 220],
  ['PHY101', 'General Physics I', 3, 100, 220],
  ['CHM101', 'General Chemistry I', 3, 100, 220],
  ['GST111', 'Communication in English', 2, 100, 240],
  ['PHY107', 'General Physics Laboratory I', 1, 100, 55],
  ['CSC201', 'Computer Programming I', 3, 200, 55],
  ['CSC203', 'Discrete Structures', 3, 200, 55],
  ['CSC205', 'Introduction to Operating Systems', 3, 200, 55],
  ['MTH201', 'Mathematical Methods I', 3, 200, 100],
  ['STA201', 'Statistics for Physical Sciences', 3, 200, 100],
  ['ENT211', 'Entrepreneurship and Innovation', 2, 200, 110],
  ['CSC301', 'Structured Programming', 3, 300, 50],
  ['CSC303', 'Data Structures and Algorithms', 3, 300, 50],
  ['CSC305', 'Operating Systems', 3, 300, 50],
  ['CSC307', 'Computer Architecture', 3, 300, 50],
  ['CSC309', 'Database Design and Management', 3, 300, 50],
  ['CSC311', 'Web Application Development', 2, 300, 25, true],
  ['CSC313', 'Computer Graphics', 2, 300, 25, true],
  ['CSC401', 'Software Engineering', 3, 400, 45],
  ['CSC403', 'Artificial Intelligence', 3, 400, 45],
  ['CSC405', 'Computer Networks and Communication', 3, 400, 45],
  ['CSC407', 'Research Methodology', 2, 400, 45],
  ['CSC409', 'Cloud Computing', 2, 400, 25, true],
  ['CSC411', 'Cyber Security', 2, 400, 25, true],
];
// electives of a level are offered at the same time: students choose one
const FIXED: Record<string, number> = {
  CSC311: slotAt('Thu', '14:00'), CSC313: slotAt('Thu', '14:00'),
  CSC409: slotAt('Wed', '14:00'), CSC411: slotAt('Wed', '14:00'),
};

let courses: Course[] = COURSES.map(([courseCode, title, unitLoad, level, expectedEnrolment]) => ({
  courseCode, title, unitLoad, level, programme: PROGRAMME, expectedEnrolment,
  ...(FIXED[courseCode] ? { slotId: FIXED[courseCode] } : {}),
}));
const electives = new Set(COURSES.filter(c => c[5]).map(c => c[0]));

const FIRST = ['Chinedu', 'Adaeze', 'Tunde', 'Ngozi', 'Emeka', 'Aisha', 'Ibrahim', 'Funmilayo', 'Oluwaseun', 'Chiamaka',
  'Musa', 'Zainab', 'Kelechi', 'Temitope', 'Uche', 'Halima', 'Babajide', 'Ifeoma', 'Segun', 'Amina', 'Obinna',
  'Yetunde', 'Daniel', 'Grace', 'Samuel', 'Blessing', 'David', 'Esther', 'Joseph', 'Mercy'];
const LAST = ['Okafor', 'Adeyemi', 'Ibrahim', 'Eze', 'Bello', 'Okonkwo', 'Ogunleye', 'Nwosu', 'Abubakar', 'Balogun',
  'Chukwu', 'Adebayo', 'Mohammed', 'Obi', 'Afolabi', 'Nnamdi', 'Yusuf', 'Olawale', 'Ekwueme', 'Danjuma'];

async function main() {
  const studentHash = await sha256('password123');
  const adminHash = await sha256('admin123');

  // first run of the generator: before registration opens
  courses = applyAllocations(courses, generateTimetable(courses, timeSlots, venues, []));

  const students: Student[] = [];
  const intake: Record<number, number> = { 100: 2025, 200: 2024, 300: 2023, 400: 2022 };
  for (const level of [100, 200, 300, 400]) {
    for (let i = 1; i <= STUDENTS_PER_LEVEL; i++) {
      const studentId = `CSC/${intake[level]}/${String(i).padStart(3, '0')}`;
      const name = studentId === 'CSC/2023/001' ? 'Chukwuemeka Obi' : `${pick(FIRST)} ${pick(LAST)}`;
      students.push({ studentId, name, programme: PROGRAMME, level, passwordHash: studentHash });
    }
  }

  let db: Database = {
    session: SESSION, registrationOpen: true, students,
    admins: [{ username: 'admin', passwordHash: adminHash }],
    courses, timeSlots, venues, registrations: [],
  };

  // most students have already registered; the demo account (CSC/2023/001) has not
  for (const s of students) {
    if (s.studentId === 'CSC/2023/001' || random() < 0.12) continue;
    const own = courses.filter(c => c.level === s.level);
    const core = own.filter(c => !electives.has(c.courseCode));
    const options = own.filter(c => electives.has(c.courseCode));
    const chosen = [...core.filter(() => random() < 0.95), ...(options.length ? [pick(options)] : [])];
    for (const c of chosen) {
      const result = registerCourse(db, s.studentId, c.courseCode);
      if (!result.ok) throw new Error(`${s.studentId} ${c.courseCode}: ${result.message}`);
      db = result.db;
    }
  }

  writeFileSync(new URL('../data/seed.json', import.meta.url), JSON.stringify(db, null, 1) + '\n');
  console.log(`seed.json: ${courses.length} courses, ${timeSlots.length} slots, ${venues.length} venues, ` +
              `${students.length} students, ${db.registrations.length} registrations`);
}

main();
