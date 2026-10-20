// __tests__/registration.test.ts
import { dropCourse, registerCourse, registeredCourseCodes } from '@/lib/registration';
import { seedDb } from '@/lib/storage';

const STUDENT = 'CSC/2023/001';            // 300 level, no registrations in the seed data

test('TC04: a non-clashing course is registered', () => {
  const result = registerCourse(seedDb(), STUDENT, 'CSC301');
  expect(result.ok).toBe(true);
  expect(result.message).toMatch(/registered successfully/);
});

test('TC05: a clashing course is rejected and the clashing course is named', () => {
  const first = registerCourse(seedDb(), STUDENT, 'CSC311');
  if (!first.ok) throw new Error(first.message);
  const second = registerCourse(first.db, STUDENT, 'CSC313');
  expect(second.ok).toBe(false);
  expect(second.message).toMatch(/Clash found with CSC311 \(Web Application Development\)/);
});

test('TC06: registering the same course twice is rejected', () => {
  const first = registerCourse(seedDb(), STUDENT, 'CSC301');
  if (!first.ok) throw new Error(first.message);
  expect(registerCourse(first.db, STUDENT, 'CSC301').message).toMatch(/already registered/);
});

test('TC07: dropping keeps the record with status DROPPED', () => {
  const first = registerCourse(seedDb(), STUDENT, 'CSC301');
  if (!first.ok) throw new Error(first.message);
  const dropped = dropCourse(first.db, STUDENT, 'CSC301');
  if (!dropped.ok) throw new Error(dropped.message);
  expect(registeredCourseCodes(dropped.db, STUDENT)).not.toContain('CSC301');
  expect(dropped.db.registrations.find(r => r.studentId === STUDENT)?.status).toBe('DROPPED');
});

test('TC08: nothing can be registered once registration is closed', () => {
  const result = registerCourse({ ...seedDb(), registrationOpen: false }, STUDENT, 'CSC301');
  expect(result.ok).toBe(false);
  expect(result.message).toMatch(/closed/);
});

test('a failed registration leaves the original data untouched', () => {
  const db = seedDb();
  const before = JSON.stringify(db);
  registerCourse(db, STUDENT, 'CSC301');
  expect(JSON.stringify(db)).toBe(before);
});
