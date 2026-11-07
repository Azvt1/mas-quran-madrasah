import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth';

// Entry point: send each person to the section for their role.
export default function Index() {
  const { session, profile } = useAuth();

  if (!session) return <Redirect href="/sign-in" />;
  if (profile?.role === 'teacher') return <Redirect href="/teacher" />;
  if (profile?.role === 'student') return <Redirect href="/student" />;
  return <Redirect href="/web-only" />;
}
