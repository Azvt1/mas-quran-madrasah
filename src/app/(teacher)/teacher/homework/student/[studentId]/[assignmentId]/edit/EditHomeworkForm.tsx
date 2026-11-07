'use client'

import { useActionState, useState, useMemo } from 'react'
import Link from 'next/link'
import { updateHomeworkAction } from './actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Search, CheckCircle2 } from 'lucide-react'
import { SURAHS, JUZ_TO_SURAHS } from '@/lib/quran/surahs'
import AyahRangePicker from '@/components/shared/AyahRangePicker'

type Tab = 'surah' | 'juz'
type Surah = { num: number; name: string; ayahs: number; juz: number }

const JUZS = Array.from({ length: 30 }, (_, i) => i + 1)

function SurahRow({ s, isSelected, onSelect }: {
  s: Surah
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
        isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 w-6 text-right tabular-nums">{s.num}</span>
        <span className={`text-sm font-medium ${isSelected ? 'text-teal-700' : 'text-slate-900'}`}>
          {s.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">{s.ayahs} ayahs</span>
        {isSelected && <CheckCircle2 size={14} className="text-teal-600" />}
      </div>
    </button>
  )
}

interface Props {
  assignmentId: string
  studentId: string
  homeworkId: string
  initialSurahNum: number | null
  initialAyahFrom: string
  initialAyahTo: string
  initialPage: string
  initialDueDate: string
  initialInstructions: string
}

export default function EditHomeworkForm({
  assignmentId,
  studentId,
  homeworkId,
  initialSurahNum,
  initialAyahFrom,
  initialAyahTo,
  initialPage,
  initialDueDate,
  initialInstructions,
}: Props) {
  const [state, action, isPending] = useActionState(updateHomeworkAction, {})

  const allSurahs: Surah[] = SURAHS.map(([num, name, ayahs, juz]) => ({ num, name, ayahs, juz }))
  const initialSurah = initialSurahNum ? allSurahs.find(s => s.num === initialSurahNum) ?? null : null

  const [tab, setTab]           = useState<Tab>('surah')
  const [search, setSearch]     = useState('')
  const [selectedJuz, setSelectedJuz] = useState<number | null>(initialSurah?.juz ?? null)
  const [selected, setSelected] = useState<Surah | null>(initialSurah)
  const [ayahFrom, setAyahFrom] = useState(parseInt(initialAyahFrom) || 1)
  const [ayahTo, setAyahTo]     = useState(parseInt(initialAyahTo) || (initialSurah?.ayahs ?? 1))
  const [page, setPage]         = useState(initialPage)

  const filteredBySearch = useMemo(() => {
    const q = search.toLowerCase()
    return allSurahs.filter(s => s.name.toLowerCase().includes(q) || String(s.num).includes(q))
  }, [search])

  const filteredByJuz = useMemo(() => {
    if (!selectedJuz) return []
    const nums = JUZ_TO_SURAHS[selectedJuz] ?? []
    return nums.map(n => allSurahs.find(s => s.num === n)).filter(Boolean) as Surah[]
  }, [selectedJuz])

  const generatedTitle = useMemo(() => {
    if (!selected) return ''
    let t = `Surah ${selected.name}`
    if (ayahTo > ayahFrom) t += `, Ayah ${ayahFrom}–${ayahTo}`
    else t += `, Ayah ${ayahFrom}`
    return t
  }, [selected, ayahFrom, ayahTo])

  const generatedRef = useMemo(() => page ? `Page ${page}` : '', [page])

  function pick(s: Surah) { setSelected(s); setAyahFrom(1); setAyahTo(s.ayahs) }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href={`/teacher/homework/student/${studentId}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} /> Back to student
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-slate-900 mb-6">Edit Homework</h1>

      <form action={action} className="space-y-6">
        <input type="hidden" name="assignment_id"  value={assignmentId} />
        <input type="hidden" name="student_id"     value={studentId} />
        <input type="hidden" name="homework_id"    value={homeworkId} />
        <input type="hidden" name="title"          value={generatedTitle} />
        <input type="hidden" name="book_reference" value={generatedRef} />
        <input type="hidden" name="surah_number"   value={selected?.num ?? ''} />

        {/* ── Surah picker ── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onClick={() => setTab('surah')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === 'surah'
                  ? 'text-teal-700 border-b-2 border-teal-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              By Surah
            </button>
            <button
              type="button"
              onClick={() => setTab('juz')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === 'juz'
                  ? 'text-teal-700 border-b-2 border-teal-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              By Juz
            </button>
          </div>

          {tab === 'surah' ? (
            <>
              <div className="px-4 py-3 border-b border-slate-50">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search surah…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-52 divide-y divide-slate-50">
                {filteredBySearch.length === 0
                  ? <p className="text-sm text-slate-400 text-center py-6">No surah found</p>
                  : filteredBySearch.map(s => (
                    <SurahRow key={s.num} s={s} isSelected={selected?.num === s.num} onSelect={() => pick(s)} />
                  ))
                }
              </div>
            </>
          ) : (
            <div className="flex" style={{ height: '13rem' }}>
              <div className="w-24 border-r border-slate-100 overflow-y-auto shrink-0">
                {JUZS.map(j => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setSelectedJuz(j)}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                      selectedJuz === j
                        ? 'bg-teal-50 text-teal-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Juz {j}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {!selectedJuz && (
                  <p className="text-sm text-slate-400 text-center py-8">Select a Juz</p>
                )}
                {filteredByJuz.map(s => (
                  <SurahRow key={s.num} s={s} isSelected={selected?.num === s.num} onSelect={() => pick(s)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Ayat picker + Page ── */}
        {selected && (
          <div className="space-y-3">
            <div className="px-1">
              <p className="text-sm font-semibold text-slate-900">
                Surah {selected.name}
                <span className="text-slate-400 font-normal ml-1">({selected.ayahs} ayahs · Juz {selected.juz})</span>
              </p>
            </div>

            <AyahRangePicker
              maxAyahs={selected.ayahs}
              from={ayahFrom}
              to={ayahTo}
              onFromChange={setAyahFrom}
              onToChange={setAyahTo}
            />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Label className="text-xs whitespace-nowrap">Page <span className="text-slate-400">(opt.)</span></Label>
                <Input
                  type="number" min="1"
                  placeholder="—"
                  value={page}
                  onChange={e => setPage(e.target.value)}
                  className="text-center w-20"
                />
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

        {/* ── Notes ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <Label htmlFor="instructions">
            Notes <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <textarea
            id="instructions"
            name="instructions"
            rows={3}
            defaultValue={initialInstructions}
            placeholder="Any specific guidance for the student…"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          />
        </div>

        {/* ── Due date ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <Label htmlFor="due_date">
            Due date <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Input id="due_date" name="due_date" type="date" defaultValue={initialDueDate} />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700"
            disabled={isPending || !selected}
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
          <Link href={`/teacher/homework/student/${studentId}`} className={buttonVariants({ variant: 'outline' })}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
