import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { DueDatePicker } from '@/components/due-date-picker';
import { AppText, Button, Card, Chip, Screen, Segmented, useInputStyle } from '@/components/ui';
import { AyahRangePicker } from '@/components/wheel-picker';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SURAHS } from '@/lib/quran/surahs';

type Surah = { num: number; name: string; ayahs: number };
// Students work backwards from Juz 30, so list 114 → 1
const ALL_SURAHS: Surah[] = SURAHS.map(([num, name, ayahs]) => ({ num, name, ayahs })).reverse();
const surahByName = (name: string) => ALL_SURAHS.find((s) => s.name === name.trim()) ?? null;
const JUZ = Array.from({ length: 30 }, (_, i) => i + 1);

type QuranMode = 'surah' | 'surah-range' | 'juz' | 'juz-range';

export interface HomeworkValues {
  title: string;
  surahNumber: number | null;
  dueDate: string | null;
  instructions: string | null;
}

interface Initial {
  title: string;
  dueDate: string | null;
  instructions: string | null;
}

/** Reads the website's title format back into form fields (for editing). */
function parseTitle(title: string) {
  let m = title.match(/^Iqra Book (\d), Pages? (\d+)(?:–(\d+))?$/);
  if (m) return { iqraBook: Number(m[1]), pageFrom: m[2], pageTo: m[3] ?? '', iqraMode: m[3] ? ('range' as const) : ('page' as const) };
  m = title.match(/^Surah (.+?), Ayah (\d+)(?:[–-](\d+))?$/);
  if (m) {
    const s = surahByName(m[1]);
    if (s) return { quranMode: 'surah' as const, surah: s, ayahFrom: Number(m[2]), ayahTo: Number(m[3] ?? m[2]) };
  }
  m = title.match(/^Surah (.+?) – Surah (.+)$/);
  if (m) return { quranMode: 'surah-range' as const, surahA: surahByName(m[1]), surahB: surahByName(m[2]) };
  m = title.match(/^Juz (\d+)$/);
  if (m) return { quranMode: 'juz' as const, juzA: Number(m[1]) };
  m = title.match(/^Juz (\d+) – Juz (\d+)$/);
  if (m) return { quranMode: 'juz-range' as const, juzA: Number(m[1]), juzB: Number(m[2]) };
  return {};
}

export function HomeworkForm({
  studentName,
  type,
  currentBook,
  nextClass,
  initial,
  submitLabel,
  submitting,
  onSubmit,
}: {
  studentName: string;
  type: 'iqra' | 'quran';
  currentBook: number;
  nextClass: string | null;
  initial?: Initial;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (v: HomeworkValues) => void;
}) {
  const inputStyle = useInputStyle();
  const c = useTheme();
  const p = useMemo(() => (initial ? parseTitle(initial.title) : {}), [initial]);

  // Iqra
  const [iqraBook, setIqraBook] = useState(p.iqraBook ?? currentBook);
  const [iqraMode, setIqraMode] = useState<'page' | 'range'>(p.iqraMode ?? 'page');
  const [pageFrom, setPageFrom] = useState(p.pageFrom ?? '');
  const [pageTo, setPageTo] = useState(p.pageTo ?? '');

  // Quran
  const [quranMode, setQuranMode] = useState<QuranMode>(p.quranMode ?? 'surah');
  const [surah, setSurah] = useState<Surah | null>(p.surah ?? null);
  const [ayahFrom, setAyahFrom] = useState(p.ayahFrom ?? 1);
  const [ayahTo, setAyahTo] = useState(p.ayahTo ?? 1);
  const [surahA, setSurahA] = useState<Surah | null>(p.surahA ?? null);
  const [surahB, setSurahB] = useState<Surah | null>(p.surahB ?? null);
  const [juzA, setJuzA] = useState<number | null>(p.juzA ?? null);
  const [juzB, setJuzB] = useState<number | null>(p.juzB ?? null);

  const [dueDate, setDueDate] = useState<string | null>(initial ? initial.dueDate : nextClass);
  const [notes, setNotes] = useState(initial?.instructions ?? '');

  // Same title format as the website, so both show homework identically
  const title = useMemo(() => {
    if (type === 'iqra') {
      if (!pageFrom) return '';
      const a = Number(pageFrom);
      if (iqraMode === 'page') return `Iqra Book ${iqraBook}, Page ${a}`;
      if (!pageTo) return '';
      const lo = Math.min(a, Number(pageTo));
      const hi = Math.max(a, Number(pageTo));
      return lo === hi ? `Iqra Book ${iqraBook}, Page ${lo}` : `Iqra Book ${iqraBook}, Pages ${lo}–${hi}`;
    }
    if (quranMode === 'surah' && surah) {
      return ayahTo > ayahFrom ? `Surah ${surah.name}, Ayah ${ayahFrom}–${ayahTo}` : `Surah ${surah.name}, Ayah ${ayahFrom}`;
    }
    if (quranMode === 'surah-range' && surahA && surahB) {
      const [a, b] = surahA.num <= surahB.num ? [surahA, surahB] : [surahB, surahA];
      return `Surah ${a.name} – Surah ${b.name}`;
    }
    if (quranMode === 'juz' && juzA) return `Juz ${juzA}`;
    if (quranMode === 'juz-range' && juzA && juzB) return `Juz ${Math.min(juzA, juzB)} – Juz ${Math.max(juzA, juzB)}`;
    return '';
  }, [type, iqraMode, iqraBook, pageFrom, pageTo, quranMode, surah, ayahFrom, ayahTo, surahA, surahB, juzA, juzB]);

  function switchQuranMode(m: QuranMode) {
    setQuranMode(m);
    setSurah(null); setSurahA(null); setSurahB(null); setJuzA(null); setJuzB(null);
  }

  const pageInput = (value: string, set: (v: string) => void, placeholder: string) => (
    <TextInput
      style={[inputStyle, { flex: 1 }]}
      value={value}
      onChangeText={(v) => set(v.replace(/\D/g, ''))}
      placeholder={placeholder}
      placeholderTextColor={c.textSecondary}
      keyboardType="number-pad"
      maxLength={3}
    />
  );

  return (
    <Screen safeTop={false}>
      <AppText variant="caption">For {studentName}</AppText>

      {type === 'iqra' ? (
        <>
          <View style={{ gap: Spacing.two }}>
            <AppText variant="label">Iqra book</AppText>
            <View style={{ flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5, 6].map((b) => (
                <Chip key={b} label={String(b)} selected={iqraBook === b} onPress={() => setIqraBook(b)} />
              ))}
            </View>
          </View>
          <Segmented
            value={iqraMode}
            onChange={setIqraMode}
            options={[{ value: 'page', label: 'Single page' }, { value: 'range', label: 'Page range' }]}
          />
          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            {pageInput(pageFrom, setPageFrom, iqraMode === 'page' ? 'Page' : 'From page')}
            {iqraMode === 'range' ? pageInput(pageTo, setPageTo, 'To page') : null}
          </View>
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' }}>
            {(
              [
                ['surah', 'Surah'],
                ['surah-range', 'Surah range'],
                ['juz', 'Juz'],
                ['juz-range', 'Juz range'],
              ] as const
            ).map(([m, label]) => (
              <Chip key={m} label={label} selected={quranMode === m} onPress={() => switchQuranMode(m)} />
            ))}
          </View>

          {quranMode === 'surah' ? (
            <>
              <SurahPicker
                label="Surah"
                value={surah}
                onChange={(s) => { setSurah(s); setAyahFrom(1); setAyahTo(s.ayahs); }}
              />
              {surah ? (
                <AyahRangePicker
                  maxAyahs={surah.ayahs}
                  from={ayahFrom}
                  to={ayahTo}
                  onChange={(f, t) => { setAyahFrom(f); setAyahTo(t); }}
                />
              ) : null}
            </>
          ) : null}

          {quranMode === 'surah-range' ? (
            <>
              <SurahPicker label="From surah" value={surahA} onChange={setSurahA} />
              <SurahPicker label="To surah" value={surahB} onChange={setSurahB} />
            </>
          ) : null}

          {quranMode === 'juz' || quranMode === 'juz-range' ? (
            <View style={{ gap: Spacing.two }}>
              <AppText variant="label">
                {quranMode === 'juz' ? 'Juz' : juzA && !juzB ? 'Now pick the last Juz' : 'Pick the first and last Juz'}
              </AppText>
              <View style={{ flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' }}>
                {JUZ.map((j) => {
                  const selected =
                    quranMode === 'juz'
                      ? juzA === j
                      : !!juzA && (juzB ? j >= Math.min(juzA, juzB) && j <= Math.max(juzA, juzB) : j === juzA);
                  return (
                    <Chip
                      key={j}
                      label={String(j)}
                      selected={selected}
                      onPress={() => {
                        if (quranMode === 'juz' || !juzA || juzB) { setJuzA(j); setJuzB(null); }
                        else setJuzB(j);
                      }}
                    />
                  );
                })}
              </View>
            </View>
          ) : null}
        </>
      )}

      <DueDatePicker value={dueDate} onChange={setDueDate} nextClass={nextClass} />

      <View style={{ gap: Spacing.two }}>
        <AppText variant="label">Note for the student (optional)</AppText>
        <TextInput
          style={[inputStyle, { minHeight: 72, textAlignVertical: 'top' }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Practise the madd letters"
          placeholderTextColor={c.textSecondary}
          multiline
        />
      </View>

      <Card>
        <AppText variant="label">Homework</AppText>
        <AppText variant="heading">{title || 'Choose what to assign'}</AppText>
      </Card>

      <Button
        title={submitLabel}
        loading={submitting}
        disabled={!title}
        onPress={() =>
          onSubmit({
            title,
            surahNumber: type === 'quran' && quranMode === 'surah' ? surah?.num ?? null : null,
            dueDate,
            instructions: notes.trim() || null,
          })
        }
      />
    </Screen>
  );
}

function SurahPicker({ label, value, onChange }: { label: string; value: Surah | null; onChange: (s: Surah) => void }) {
  const c = useTheme();
  const inputStyle = useInputStyle();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(!value);

  const q = query.trim().toLowerCase();
  const matches = ALL_SURAHS.filter((s) => !q || s.name.toLowerCase().includes(q) || String(s.num) === q);

  if (!open && value) {
    return (
      <Pressable onPress={() => setOpen(true)}>
        <Card>
          <AppText variant="label">{label}</AppText>
          <AppText variant="heading">{`${value.num}. ${value.name}`}</AppText>
          <AppText variant="caption">{`${value.ayahs} ayahs · tap to change`}</AppText>
        </Card>
      </Pressable>
    );
  }

  return (
    <View style={{ gap: Spacing.two }}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        style={inputStyle}
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or number"
        placeholderTextColor={c.textSecondary}
        autoCorrect={false}
      />
      <Card style={{ padding: 0, height: 280, overflow: 'hidden' }}>
        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {matches.map((s) => (
            <Pressable
              key={s.num}
              onPress={() => { onChange(s); setOpen(false); setQuery(''); }}
              style={({ pressed }) => ({
                paddingHorizontal: Spacing.three,
                paddingVertical: 12,
                backgroundColor: pressed ? c.border : 'transparent',
                borderBottomWidth: 0.5,
                borderBottomColor: c.border,
              })}>
              <AppText>{`${s.num}. ${s.name}`}</AppText>
            </Pressable>
          ))}
        </ScrollView>
      </Card>
    </View>
  );
}
