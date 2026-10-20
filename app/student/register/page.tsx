// app/student/register/page.tsx — course registration
'use client';
import AppShell from '@/components/AppShell';
import CourseList from '@/components/CourseList';
import RouteGuard from '@/components/RouteGuard';

export default function RegisterPage() {
  return (
    <RouteGuard role="student">
      {session => (
        <AppShell session={session} title="Course Registration"
          description="Add the courses you will take this semester. Clashes are detected as soon as you add a course.">
          <CourseList studentId={session.id} />
        </AppShell>
      )}
    </RouteGuard>
  );
}
