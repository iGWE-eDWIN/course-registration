// components/Logo.tsx
import { GraduationCap } from 'lucide-react';
import { cx } from './ui';

export default function Logo({ inverted, compact }: { inverted?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cx('flex h-9 w-9 items-center justify-center rounded-lg',
        inverted ? 'bg-white/10 text-white ring-1 ring-white/20' : 'bg-brand-600 text-white')}>
        <GraduationCap className="h-5 w-5" aria-hidden />
      </div>
      <div className="leading-tight">
        <p className={cx('text-sm font-bold tracking-tight', inverted ? 'text-white' : 'text-slate-900')}>CRTMS</p>
        {!compact && (
          <p className={cx('text-[11px]', inverted ? 'text-brand-200/80' : 'text-slate-500')}>Registration &amp; Timetabling</p>
        )}
      </div>
    </div>
  );
}
