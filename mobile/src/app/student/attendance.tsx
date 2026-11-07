import { View } from 'react-native';

import { AppText, Badge, Card, ErrorState, LoadingBlock, Screen, SectionTitle, StatTile } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { formatSessionDate } from '@/lib/greeting';
import { useMyAttendance, type MyStatus } from '@/lib/student-data';

const LABEL: Record<NonNullable<MyStatus>, { text: string; tone: 'tint' | 'warning' | 'danger' | 'neutral' }> = {
  present: { text: 'Present', tone: 'tint' },
  late: { text: 'Late', tone: 'warning' },
  absent: { text: 'Absent', tone: 'danger' },
  excused: { text: 'Excused', tone: 'neutral' },
};

export default function MyAttendance() {
  const { data, isPending, isError, refetch, isRefetching } = useMyAttendance();
  const past = (data?.sessions ?? []).filter((s) => s.past).reverse();

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
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: Spacing.three }}>
            <StatTile label="Attendance" value={data.rate === null ? '—' : `${data.rate}%`} />
            <StatTile label="Classes" value={past.length} hint={`${data.present} present · ${data.late} late · ${data.absent} absent`} />
          </View>
          {past.length ? <SectionTitle>Classes so far</SectionTitle> : null}
          {past.map((s) => (
            <Card key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText>{formatSessionDate(s.date)}</AppText>
              {s.status ? <Badge label={LABEL[s.status].text} tone={LABEL[s.status].tone} /> : <Badge label="Not marked" />}
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
