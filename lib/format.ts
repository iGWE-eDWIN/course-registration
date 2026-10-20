// lib/format.ts
import type { Day } from './types';

export const DAY_NAMES: Record<Day, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday',
};

export function formatCode(code: string): string {
  return code.replace(/^([A-Z]{3})(\d{3})$/, '$1 $2');
}

export function formatLevel(level: number): string {
  return `${level} Level`;
}

export const LEVEL_STYLES: Record<number, string> = {
  100: 'bg-sky-100/70 text-sky-900 ring-sky-300',
  200: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  300: 'bg-violet-50 text-violet-800 ring-violet-200',
  400: 'bg-amber-50 text-amber-800 ring-amber-200',
  500: 'bg-rose-50 text-rose-800 ring-rose-200',
};
