import { View } from 'react-native';

import { AppText, Card, EmptyState, ErrorState, LoadingBlock, Screen, SectionTitle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { juzProgress, surahName } from '@/lib/quran/surahs';
import { useMyHomework, useMyProgress } from '@/lib/student-data';

function Bar({ pct }: { pct: number }) {
  const c = useTheme();
  return (
    <View style={{ height: 10, borderRadius: Radius.pill, backgroundColor: c.tintSoft, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', backgroundColor: c.tint, borderRadius: Radius.pill }} />
    </View>
  );
}

export default function MyProgress() {
  const progress = useMyProgress();
  const homework = useMyHomework();
  const refetch = () => { progress.refetch(); homework.refetch(); };

  if (progress.isPending) {
    return (
      <Screen>
        <AppText variant="title">Progress</AppText>
        <LoadingBlock />
      </Screen>
    );
  }
  if (progress.isError) {
    return (
      <Screen>
        <AppText variant="title">Progress</AppText>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const { type, teacherName, iqra } = progress.data;

  // Quran position = lowest surah assigned so far (students go 114 → 1)
  const surahHw = (homework.data ?? []).filter((a) => a.surahNumber);
  const currentSurah = surahHw.length ? Math.min(...surahHw.map((a) => a.surahNumber!)) : null;
  const jp = currentSurah ? juzProgress(currentSurah) : null;

  return (
    <Screen onRefresh={refetch} refreshing={progress.isRefetching || homework.isRefetching}>
      <View>
        <AppText variant="title">Progress</AppText>
        {teacherName ? <AppText variant="caption">{`Teacher: ${teacherName}`}</AppText> : null}
      </View>

      {type === 'iqra' ? (
        iqra ? (
          <Card style={{ gap: Spacing.two }}>
            <AppText variant="label">Iqra</AppText>
            <AppText variant="title">{`Book ${iqra.current_book}`}</AppText>
            <AppText variant="caption">{`Page ${iqra.current_page}`}</AppText>
            <Bar pct={((iqra.current_book - 1) / 6) * 100} />
            <AppText variant="caption">{`Book ${iqra.current_book} of 6`}</AppText>
          </Card>
        ) : (
          <EmptyState title="No progress yet" message="Your teacher will set your Iqra book soon." />
        )
      ) : jp && currentSurah ? (
        <Card style={{ gap: Spacing.two }}>
          <AppText variant="label">{`Juz ${jp.juz}`}</AppText>
          <AppText variant="title">{surahName(currentSurah)}</AppText>
          <AppText variant="caption">{`Surah ${currentSurah}`}</AppText>
          <Bar pct={jp.pct} />
          <AppText variant="caption">
            {jp.left > 0 ? `${jp.done} of ${jp.total} surahs done · ${jp.left} left in Juz ${jp.juz}` : `Juz ${jp.juz} complete! 🎉`}
          </AppText>
        </Card>
      ) : (
        <EmptyState title="No progress yet" message="Your progress appears once your teacher assigns homework." />
      )}

      {type === 'quran' && surahHw.length ? (
        <View style={{ gap: Spacing.two }}>
          <SectionTitle>History</SectionTitle>
          {surahHw.slice(0, 10).map((a) => (
            <Card key={a.id}>
              <AppText>{a.title}</AppText>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
