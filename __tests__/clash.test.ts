// __tests__/clash.test.ts
import { overlaps } from '@/lib/clash';
import type { Day, TimeSlot } from '@/lib/types';

const existing: TimeSlot = { slotId: 1, day: 'Mon', start: '10:00', end: '12:00' };

test.each<[string, Day, string, string, boolean]>([
  ['BT01', 'Mon', '10:00', '12:00', true],
  ['BT02', 'Mon', '11:00', '13:00', true],
  ['BT03', 'Mon', '09:00', '11:00', true],
  ['BT04', 'Mon', '10:30', '11:30', true],
  ['BT05', 'Mon', '09:00', '13:00', true],
  ['BT06', 'Mon', '08:00', '10:00', false],
  ['BT07', 'Mon', '12:00', '14:00', false],
  ['BT08', 'Tue', '10:00', '12:00', false],
])('%s: %s %s-%s clashes = %s', (_id, day, start, end, expected) => {
  expect(overlaps(existing, { slotId: 2, day, start, end })).toBe(expected);
});
