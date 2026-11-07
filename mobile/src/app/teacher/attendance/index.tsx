import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText, Badge, EmptyState, ErrorState, LoadingBlock, RowCard, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { formatSessionDate, localDateString } from '@/lib/greeting';
import { useTermSessions, type SessionSummary } from '@/lib/teacher-data';

function monthLabel(iso: string) {
  const [y, m] = iso.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

export default function AttendanceList() {
  const { data, isPending, isError, refetch, isRefetching } = useTermSessions();
  const today = localDateString();

  const months = new Map<string, SessionSummary[]>();
  data?.sessions.forEach((s) => {
    const key = monthLabel(s.date);
    months.set(key, [...(months.get(key) ?? []), s]);
  });

  // Today's class (or the next one) goes first so it's one tap away
  const upcoming = data?.sessions.find((s) => s.date >= today);

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      <View>
        <AppText variant="title">Attendance</AppText>
        {data?.termName ? <AppText variant="caption">{data.termName}</AppText> : null}
      </View>

      {isPending ? (
        <LoadingBlock />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data.sessions.length ? (
        <EmptyState title="No classes this term" message="Ask the admin to set up the current term." />
      ) : (
        <>
          {upcoming ? (
            <RowCard onPress={() => router.push(`/teacher/attendance/${upcoming.id}`)}>
              <AppText variant="label">{upcoming.date === today ? 'Today' : 'Next class'}</AppText>
              <AppText variant="heading">{formatSessionDate(upcoming.date)}</AppText>
              <SessionBadge session={upcoming} total={data.studentCount} today={today} />
            </RowCard>
          ) : null}

          {[...months.entries()].map(([month, sessions]) => (
            <View key={month} style={{ gap: Spacing.two }}>
              <SectionTitle>{month}</SectionTitle>
              {sessions.map((s) => (
                <RowCard key={s.id} onPress={() => router.push(`/teacher/attendance/${s.id}`)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <AppText>{formatSessionDate(s.date)}</AppText>
                    <SessionBadge session={s} total={data.studentCount} today={today} />
                  </View>
                </RowCard>
              ))}
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}

function SessionBadge({ session, total, today }: { session: SessionSummary; total: number; today: string }) {
  if (session.marked >= total && total > 0) return <Badge label="Done" tone="tint" />;
  if (session.marked > 0) return <Badge label={`${session.marked}/${total}`} tone="warning" />;
  if (session.date < today) return <Badge label="Not marked" tone="danger" />;
  if (session.date === today) return <Badge label="Mark now" tone="warning" />;
  return <Badge label="Upcoming" />;
}
