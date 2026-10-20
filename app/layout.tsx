// app/layout.tsx — shared page layout
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { DatabaseProvider } from '@/lib/storage';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CRTMS · Course Registration & Timetable Management',
  description: 'Register for courses with real-time clash detection and view automatically generated timetables.',
};

export const viewport: Viewport = { themeColor: '#121d4f', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <DatabaseProvider>{children}</DatabaseProvider>
      </body>
    </html>
  );
}
