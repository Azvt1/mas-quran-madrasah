import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { AppText, Card, LoadingBlock, Screen, StatTile } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { formatSessionDate, greeting, localDateString } from '@/lib/greeting';
import { supabase } from '@/lib/supabase';

async function fetchTeacherHome(teacherId: string) {
  const today = localDateString();
  // One parallel round trip; homework rows are RLS-scoped to this teacher.
  const [students, pending, nextClass] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId).eq('is_active', true),
    // pending = no feedback yet (behavior_satisfactory is null)
    supabase.from('homework_assignments')
      .select('id, homework!inner(terms!inner(is_active))', { count: 'exact', head: true })
      .eq('homework.terms.is_active', true)
      .eq('is_completed', false).is('behavior_satisfactory', null),
    supabase.from('class_sessions').select('session_date')
      .gte('session_date', today).order('session_date').limit(1).maybeSingle(),
  ]);
  if (students.error) throw students.error;
  return {
    studentCount: students.count ?? 0,
    pendingCount: pending.count ?? 0,
    nextClass: nextClass.data?.session_date ?? null,
    isToday: nextClass.data?.session_date === today,
  };
}

export default function TeacherHome() {
  const { profile } = useAuth();
  const { data, isPending, refetch, isRefetching } = useQuery({
    queryKey: ['teacher-home', profile?.id],
    queryFn: () => fetchTeacherHome(profile!.id),
    enabled: !!profile,
  });

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      <View>
        <AppText variant="caption">{greeting()}</AppText>
        <AppText variant="title">{profile?.full_name}</AppText>
      </View>

      {isPending ? (
        <LoadingBlock />
      ) : data ? (
        <>
          <Card>
            <AppText variant="label">{data.isToday ? 'Class today' : 'Next class'}</AppText>
            <AppText variant="heading">
              {data.nextClass ? formatSessionDate(data.nextClass) : 'No upcoming classes'}
            </AppText>
          </Card>
          <View style={{ flexDirection: 'row', gap: Spacing.three }}>
            <StatTile label="Students" value={data.studentCount} />
            <StatTile label="Pending homework" value={data.pendingCount} hint="Waiting for feedback" />
          </View>
        </>
      ) : (
        <AppText variant="caption">Could not load. Pull down to try again.</AppText>
      )}
    </Screen>
  );
}
