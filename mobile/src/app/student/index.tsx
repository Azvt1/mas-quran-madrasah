import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { AppText, Card, LoadingBlock, Screen, StatTile } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { formatSessionDate, greeting, localDateString } from '@/lib/greeting';
import { supabase } from '@/lib/supabase';

async function fetchStudentHome(profileId: string) {
  const today = localDateString();
  // One parallel round trip; RLS only returns this student's own rows.
  const [student, iqra, quran, pending, nextClass] = await Promise.all([
    supabase.from('students').select('id, student_type').eq('profile_id', profileId).maybeSingle(),
    supabase.from('iqra_progress').select('current_book, current_page').maybeSingle(),
    supabase.from('quran_progress').select('current_surah, current_juz').maybeSingle(),
    supabase.from('homework_assignments')
      .select('id, homework!inner(terms!inner(is_active))', { count: 'exact', head: true })
      .eq('homework.terms.is_active', true)
      .eq('is_completed', false).is('behavior_satisfactory', null),
    supabase.from('class_sessions').select('session_date')
      .gte('session_date', today).order('session_date').limit(1).maybeSingle(),
  ]);
  if (student.error) throw student.error;

  const progress =
    student.data?.student_type === 'iqra'
      ? iqra.data ? `Book ${iqra.data.current_book} · Page ${iqra.data.current_page}` : 'Not set'
      : quran.data ? `Surah ${quran.data.current_surah} · Juz ${quran.data.current_juz}` : 'Not set';

  return {
    hasRecord: !!student.data,
    studentType: student.data?.student_type as 'iqra' | 'quran' | undefined,
    progress,
    pendingCount: pending.count ?? 0,
    nextClass: nextClass.data?.session_date ?? null,
    isToday: nextClass.data?.session_date === today,
  };
}

export default function StudentHome() {
  const { profile } = useAuth();
  const { data, isPending, refetch, isRefetching } = useQuery({
    queryKey: ['student-home', profile?.id],
    queryFn: () => fetchStudentHome(profile!.id),
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
      ) : !data ? (
        <AppText variant="caption">Could not load. Pull down to try again.</AppText>
      ) : !data.hasRecord ? (
        <Card>
          <AppText variant="heading">Account not set up yet</AppText>
          <AppText variant="caption">Ask the madrasa admin to finish setting up your account.</AppText>
        </Card>
      ) : (
        <>
          <Card>
            <AppText variant="label">{data.isToday ? 'Class today' : 'Next class'}</AppText>
            <AppText variant="heading">
              {data.nextClass ? formatSessionDate(data.nextClass) : 'No upcoming classes'}
            </AppText>
          </Card>
          <View style={{ flexDirection: 'row', gap: Spacing.three }}>
            <StatTile label="Homework" value={data.pendingCount} hint="To do" />
            <StatTile
              label={data.studentType === 'quran' ? 'Quran' : 'Iqra'}
              value={<AppText variant="heading">{data.progress}</AppText>}
            />
          </View>
        </>
      )}
    </Screen>
  );
}
