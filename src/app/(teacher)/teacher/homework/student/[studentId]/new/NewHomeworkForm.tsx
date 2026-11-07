'use client'

import { useActionState, useState, useMemo } from 'react'
import Link from 'next/link'
import { createHomeworkAction } from './actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Search, CheckCircle2 } from 'lucide-react'
import { SURAHS } from '@/lib/quran/surahs'
import AyahRangePicker from '@/components/shared/AyahRangePicker'

// ─── Types ───────────────────────────────────────────────────────────────────

type QuranMode = 'surah' | 'surah-range' | 'juz' | 'juz-range'
type IqraMode  = 'page' | 'page-range'
type Surah     = { num: number; name: string; ayahs: number; juz: number }

const JUZS = Array.from({ length: 30 }, (_, i) => i + 1)
const IQRA_BOOKS = Array.from({ length: 6 }, (_, i) => i + 1)
const allSurahs: Surah[] = SURAHS.map(([num, name, ayahs, juz]) => ({ num, name, ayahs, juz }))

const QURAN_MODE_LABELS: { key: QuranMode; label: string }[] = [
  { key: 'surah',       label: 'Single Surah' },
  { key: 'surah-range', label: 'Surah Range'  },
  { key: 'juz',         label: 'Single Juz'   },
  { key: 'juz-range',   label: 'Juz Range'    },
]

const IQRA_MODE_LABELS: { key: IqraMode; label: string }[] = [
  { key: 'page',       label: 'Single Page' },
  { key: 'page-range', label: 'Page Range'  },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function SurahRow({ s, selected, onSelect }: { s: Surah; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect}
      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${selected ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 w-6 text-right tabular-nums">{s.num}</span>
        <span className={`text-sm font-medium ${selected ? 'text-teal-700' : 'text-slate-900'}`}>{s.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">{s.ayahs} ayahs</span>
        {selected && <CheckCircle2 size={14} className="text-teal-600" />}
      </div>
    </button>
  )
}

function SurahPicker({ label, value, onSelect }: { label: string; value: Surah | null; onSelect: (s: Surah) => void }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allSurahs.filter(s => s.name.toLowerCase().includes(q) || String(s.num).includes(q))
  }, [search])
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1 mb-2">{label}</p>
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="overflow-y-auto max-h-44 divide-y divide-slate-50">
          {filtered.map(s => (
            <SurahRow key={s.num} s={s} selected={value?.num === s.num} onSelect={() => onSelect(s)} />
          ))}
        </div>
      </div>
      {value && <p className="text-xs text-teal-700 font-medium mt-1.5 px-1">✓ {value.name}</p>}
    </div>
  )
}

function JuzSelector({ label, value, onChange }: { label: string; value: number | null; onChange: (j: number) => void }) {
  return (
    <div className="flex-1">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="border border-slate-200 rounded-xl overflow-y-auto" style={{ maxHeight: '11rem' }}>
        {JUZS.map(j => (
          <button key={j} type="button" onClick={() => onChange(j)}
            className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === j ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            Juz {j}
          </button>
        ))}
      </div>
      {value && <p className="text-xs text-teal-700 font-medium mt-1.5 px-1">✓ Juz {value}</p>}
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface Props {
  studentId: string
  studentType: 'iqra' | 'quran'
  currentBook: number
}

export default function NewHomeworkForm({ studentId, studentType, currentBook }: Props) {
  const [state, action, isPending] = useActionState(createHomeworkAction, {})

  // ── Quran state ──
  const [quranMode, setQuranMode]     = useState<QuranMode>('surah')
  const [selected, setSelected]       = useState<Surah | null>(null)
  const [search, setSearch]           = useState('')
  const [ayahFrom, setAyahFrom]       = useState(1)
  const [ayahTo, setAyahTo]           = useState(1)
  const [page, setPage]               = useState('')
  const [surahFrom, setSurahFrom]     = useState<Surah | null>(null)
  const [surahTo,   setSurahTo]       = useState<Surah | null>(null)
  const [singleJuz, setSingleJuz]     = useState<number | null>(null)
  const [juzFrom,   setJuzFrom]       = useState<number | null>(null)
  const [juzTo,     setJuzTo]         = useState<number | null>(null)

  // ── Iqra state ──
  const [iqraMode, setIqraMode]       = useState<IqraMode>('page-range')
  const [iqraBook, setIqraBook]       = useState<number>(currentBook)
  const [iqraPage, setIqraPage]       = useState<number | ''>('')
  const [iqraPageFrom, setIqraPageFrom] = useState<number | ''>('')
  const [iqraPageTo,   setIqraPageTo]   = useState<number | ''>('')

  const filteredSurahs = useMemo(() => {
    const q = search.toLowerCase()
    return allSurahs.filter(s => s.name.toLowerCase().includes(q) || String(s.num).includes(q))
  }, [search])

  function pick(s: Surah) { setSelected(s); setAyahFrom(1); setAyahTo(s.ayahs) }

  // ── Generated title / ref ──
  const generatedTitle = useMemo(() => {
    if (studentType === 'iqra') {
      if (iqraMode === 'page' && iqraPage !== '')
        return `Iqra Book ${iqraBook}, Page ${iqraPage}`
      if (iqraMode === 'page-range' && iqraPageFrom !== '' && iqraPageTo !== '') {
        const lo = Math.min(Number(iqraPageFrom), Number(iqraPageTo))
        const hi = Math.max(Number(iqraPageFrom), Number(iqraPageTo))
        return lo === hi
          ? `Iqra Book ${iqraBook}, Page ${lo}`
          : `Iqra Book ${iqraBook}, Pages ${lo}–${hi}`
      }
      return ''
    }
    // Quran
    if (quranMode === 'surah' && selected) {
      let t = `Surah ${selected.name}`
      if (ayahTo > ayahFrom) t += `, Ayah ${ayahFrom}–${ayahTo}`
      else t += `, Ayah ${ayahFrom}`
      return t
    }
    if (quranMode === 'surah-range' && surahFrom && surahTo) {
      const a = surahFrom.num <= surahTo.num ? surahFrom : surahTo
      const b = surahFrom.num <= surahTo.num ? surahTo   : surahFrom
      return `Surah ${a.name} – Surah ${b.name}`
    }
    if (quranMode === 'juz' && singleJuz) return `Juz ${singleJuz}`
    if (quranMode === 'juz-range' && juzFrom && juzTo) {
      const lo = Math.min(juzFrom, juzTo)
      const hi = Math.max(juzFrom, juzTo)
      return `Juz ${lo} – Juz ${hi}`
    }
    return ''
  }, [studentType, iqraMode, iqraBook, iqraPage, iqraPageFrom, iqraPageTo,
      quranMode, selected, ayahFrom, ayahTo, surahFrom, surahTo, singleJuz, juzFrom, juzTo])

  const generatedRef = useMemo(() => {
    if (studentType === 'iqra') return '' // title already has all info
    return page ? `Page ${page}` : ''
  }, [studentType, page])

  const isValid = studentType === 'iqra'
    ? (iqraMode === 'page'       && iqraPage !== '')
    || (iqraMode === 'page-range' && iqraPageFrom !== '' && iqraPageTo !== '')
    : (quranMode === 'surah'       && selected  !== null)
    || (quranMode === 'surah-range' && surahFrom !== null && surahTo !== null)
    || (quranMode === 'juz'         && singleJuz !== null)
    || (quranMode === 'juz-range'   && juzFrom   !== null && juzTo   !== null)

  function switchQuranMode(m: QuranMode) {
    setQuranMode(m)
    setSelected(null); setSurahFrom(null); setSurahTo(null)
    setSingleJuz(null); setJuzFrom(null); setJuzTo(null)
    setSearch('')
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href={`/teacher/homework/student/${studentId}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} /> Back to student
        </Link>
      </div>

      <form action={action} className="space-y-5">
        <input type="hidden" name="student_id"     value={studentId} />
        <input type="hidden" name="title"          value={generatedTitle} />
        <input type="hidden" name="book_reference" value={generatedRef} />
        <input type="hidden" name="surah_number"   value={studentType === 'quran' && quranMode === 'surah' ? (selected?.num ?? '') : ''} />

        {/* ══════════════════════ IQRA FORM ══════════════════════ */}
        {studentType === 'iqra' && (
          <>
            {/* Mode selector */}
            <div className="bg-white border border-slate-200 rounded-xl p-1 grid grid-cols-2 gap-1">
              {IQRA_MODE_LABELS.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setIqraMode(key)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors text-center ${
                    iqraMode === key ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Book selector */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Iqra Book</p>
              <div className="flex gap-2 flex-wrap">
                {IQRA_BOOKS.map(b => (
                  <button key={b} type="button" onClick={() => setIqraBook(b)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                      iqraBook === b
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Page inputs */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
              {iqraMode === 'page' ? (
                <div className="flex items-center gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Page</Label>
                    <Input
                      type="number" min="1" placeholder="—"
                      value={iqraPage}
                      onChange={e => setIqraPage(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-24 text-center"
                    />
                  </div>
                  {generatedTitle && (
                    <div className="flex-1 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-teal-600 font-medium">{generatedTitle}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-end gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">From page</Label>
                      <Input
                        type="number" min="1" placeholder="—"
                        value={iqraPageFrom}
                        onChange={e => setIqraPageFrom(e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-24 text-center"
                      />
                    </div>
                    <span className="text-slate-400 pb-2">→</span>
                    <div>
                      <Label className="text-xs mb-1 block">To page</Label>
                      <Input
                        type="number" min="1" placeholder="—"
                        value={iqraPageTo}
                        onChange={e => setIqraPageTo(e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-24 text-center"
                      />
                    </div>
                  </div>
                  {generatedTitle && (
                    <div className="bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-teal-600 font-medium">{generatedTitle}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════ QURAN FORM ══════════════════════ */}
        {studentType === 'quran' && (
          <>
            {/* Mode selector */}
            <div className="bg-white border border-slate-200 rounded-xl p-1 grid grid-cols-2 gap-1 sm:grid-cols-4">
              {QURAN_MODE_LABELS.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => switchQuranMode(key)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors text-center ${
                    quranMode === key ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Single Surah */}
            {quranMode === 'surah' && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search surah…" value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-52 divide-y divide-slate-50">
                  {filteredSurahs.map(s => (
                    <SurahRow key={s.num} s={s} selected={selected?.num === s.num} onSelect={() => pick(s)} />
                  ))}
                </div>
              </div>
            )}

            {/* Single Surah: Ayah range */}
            {quranMode === 'surah' && selected && (
              <div className="space-y-3">
                <div className="px-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Surah {selected.name}
                    <span className="text-slate-400 font-normal ml-1">({selected.ayahs} ayahs · Juz {selected.juz})</span>
                  </p>
                </div>
                <AyahRangePicker maxAyahs={selected.ayahs} from={ayahFrom} to={ayahTo}
                  onFromChange={setAyahFrom} onToChange={setAyahTo} />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <Label className="text-xs whitespace-nowrap">Page <span className="text-slate-400">(opt.)</span></Label>
                    <Input type="number" min="1" placeholder="—" value={page}
                      onChange={e => setPage(e.target.value)} className="text-center w-20" />
                  </div>
                  {generatedTitle && (
                    <div className="flex-1 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2 min-w-0">
                      <p className="text-xs text-teal-600 font-medium truncate">
                        {generatedTitle}{generatedRef ? ` · ${generatedRef}` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Surah Range */}
            {quranMode === 'surah-range' && (
              <div className="flex gap-3">
                <SurahPicker label="From" value={surahFrom} onSelect={setSurahFrom} />
                <SurahPicker label="To"   value={surahTo}   onSelect={setSurahTo}   />
              </div>
            )}

            {/* Single Juz */}
            {quranMode === 'juz' && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-y-auto" style={{ maxHeight: '14rem' }}>
                {JUZS.map(j => (
                  <button key={j} type="button" onClick={() => setSingleJuz(j)}
                    className={`w-full text-left px-4 py-3 text-sm border-b border-slate-50 last:border-0 transition-colors ${
                      singleJuz === j ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>Juz {j}</span>
                      {singleJuz === j && <CheckCircle2 size={14} className="text-teal-600" />}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Juz Range */}
            {quranMode === 'juz-range' && (
              <div className="flex gap-3">
                <JuzSelector label="From" value={juzFrom} onChange={setJuzFrom} />
                <JuzSelector label="To"   value={juzTo}   onChange={setJuzTo}   />
              </div>
            )}

            {/* Title preview for non-surah modes */}
            {generatedTitle && quranMode !== 'surah' && (
              <div className="bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                <p className="text-xs text-teal-600 font-medium">{generatedTitle}</p>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════ SHARED ══════════════════════ */}

        {/* Notes */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <Label htmlFor="instructions">
            Notes <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <textarea id="instructions" name="instructions" rows={3}
            placeholder="Any specific guidance for the student…"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Due date */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <Label htmlFor="due_date">
            Due date <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Input id="due_date" name="due_date" type="date" />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" className="bg-teal-600 hover:bg-teal-700"
            disabled={isPending || !isValid}
          >
            {isPending ? 'Assigning…' : 'Assign homework'}
          </Button>
          <Link href={`/teacher/homework/student/${studentId}`} className={buttonVariants({ variant: 'outline' })}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
