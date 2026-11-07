'use client'

import { useActionState, useState, useMemo } from 'react'
import { saveProgressAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Search } from 'lucide-react'
import { SURAHS, JUZ_TO_SURAHS } from '@/lib/quran/surahs'

type Tab = 'surah' | 'juz'
type SurahObj = { num: number; name: string; ayahs: number; juz: number }

const JUZS = Array.from({ length: 30 }, (_, i) => i + 1)
const allSurahs: SurahObj[] = SURAHS.map(([num, name, ayahs, juz]) => ({ num, name, ayahs, juz }))

function SurahRow({ s, isSelected, onSelect }: { s: SurahObj; isSelected: boolean; onSelect: () => void }) {
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
        <span className={`text-sm font-medium ${isSelected ? 'text-teal-700' : 'text-slate-900'}`}>{s.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">{s.ayahs} ayahs</span>
        {isSelected && <CheckCircle2 size={14} className="text-teal-600" />}
      </div>
    </button>
  )
}

interface Props {
  studentId:   string
  studentType: 'iqra' | 'quran'
  current?: { book?: number; page?: number; surah?: number; juz?: number } | null
}

export default function ProgressForm({ studentId, studentType, current }: Props) {
  const [state, action, isPending] = useActionState(saveProgressAction, {})

  // Iqra state
  const [selectedBook, setSelectedBook] = useState<number>(current?.book ?? 1)

  // Quran state
  const [tab, setTab]               = useState<Tab>('surah')
  const [search, setSearch]         = useState('')
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null)
  const [surahNum, setSurahNum]     = useState<number | null>(current?.surah ?? null)
  const [juz, setJuz]               = useState<number | null>(current?.juz ?? null)
  const [page, setPage]             = useState<string>(current?.page ? String(current.page) : '')

  const filteredBySearch = useMemo(() => {
    const q = search.toLowerCase()
    return allSurahs.filter(s => s.name.toLowerCase().includes(q) || String(s.num).includes(q))
  }, [search])

  const filteredByJuz = useMemo(() => {
    if (!selectedJuz) return []
    const nums = JUZ_TO_SURAHS[selectedJuz] ?? []
    return nums.map(n => allSurahs.find(s => s.num === n)).filter(Boolean) as SurahObj[]
  }, [selectedJuz])

  const selectedSurah = allSurahs.find(s => s.num === surahNum)

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="student_id"   value={studentId} />
      <input type="hidden" name="student_type" value={studentType} />

      {studentType === 'iqra' ? (
        <>
          <div className="space-y-2">
            <Label>Current book</Label>
            <input type="hidden" name="current_book" value={selectedBook} />
            <div className="flex gap-2">
              {[1,2,3,4,5,6].map(n => (
                <button key={n} type="button" onClick={() => setSelectedBook(n)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold border transition-colors ${
                    selectedBook === n
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700'
                  }`}>{n}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="current_page">Current page</Label>
            <Input id="current_page" name="current_page" type="number" min={1}
              defaultValue={current?.page ?? ''} placeholder="e.g. 15" className="w-32" required />
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="current_surah" value={surahNum ?? ''} />
          <input type="hidden" name="current_juz"   value={juz ?? ''} />
          <input type="hidden" name="current_page"  value={page} />

          {/* Surah picker with tabs */}
          <div className="space-y-2">
            <Label>Current surah</Label>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-slate-100">
                {(['surah','juz'] as Tab[]).map(t => (
                  <button key={t} type="button" onClick={() => setTab(t)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      tab === t
                        ? 'text-teal-700 border-b-2 border-teal-600 -mb-px'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}>
                    {t === 'surah' ? 'By Surah' : 'By Juz'}
                  </button>
                ))}
              </div>

              {tab === 'surah' ? (
                <>
                  <div className="px-3 py-2.5 border-b border-slate-50">
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Search surah…" value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-44 divide-y divide-slate-50">
                    {filteredBySearch.length === 0
                      ? <p className="text-sm text-slate-400 text-center py-5">No surah found</p>
                      : filteredBySearch.map(s => (
                        <SurahRow key={s.num} s={s} isSelected={surahNum === s.num} onSelect={() => setSurahNum(s.num)} />
                      ))
                    }
                  </div>
                </>
              ) : (
                <div className="flex" style={{ height: '11rem' }}>
                  <div className="w-20 border-r border-slate-100 overflow-y-auto shrink-0">
                    {JUZS.map(j => (
                      <button key={j} type="button" onClick={() => setSelectedJuz(j)}
                        className={`w-full text-left px-2.5 py-2 text-sm transition-colors ${
                          selectedJuz === j ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}>Juz {j}</button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                    {!selectedJuz
                      ? <p className="text-sm text-slate-400 text-center py-8">Select a Juz</p>
                      : filteredByJuz.map(s => (
                        <SurahRow key={s.num} s={s} isSelected={surahNum === s.num} onSelect={() => setSurahNum(s.num)} />
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
            {selectedSurah && (
              <p className="text-xs text-teal-600 font-medium pl-1">
                ✓ {selectedSurah.name} (Juz {selectedSurah.juz})
              </p>
            )}
          </div>

          {/* Juz */}
          <div className="space-y-2">
            <Label>Current juz</Label>
            <div className="grid grid-cols-10 gap-1.5">
              {JUZS.map(n => (
                <button key={n} type="button" onClick={() => setJuz(n)}
                  className={`h-9 rounded-lg text-xs font-semibold border transition-colors ${
                    juz === n
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700'
                  }`}>{n}</button>
              ))}
            </div>
          </div>

          {/* Page */}
          <div className="space-y-1.5">
            <Label>Current page <span className="text-slate-400 font-normal">(1–604)</span></Label>
            <Input type="number" min={1} max={604} value={page}
              onChange={e => setPage(e.target.value)} placeholder="e.g. 440" className="w-32" />
          </div>

          {(surahNum || juz || page) && (
            <div className="bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
              <p className="text-xs text-teal-600 font-medium">
                {[
                  surahNum && selectedSurah ? `Surah ${selectedSurah.name}` : null,
                  juz ? `Juz ${juz}` : null,
                  page ? `Page ${page}` : null,
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}
        </>
      )}

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-teal-700 bg-teal-50 border border-teal-100 px-3 py-2 rounded-md flex items-center gap-2">
          <CheckCircle2 size={14} /> Progress saved successfully.
        </p>
      )}

      <Button type="submit" className="bg-teal-600 hover:bg-teal-700"
        disabled={isPending || (studentType === 'quran' && (!surahNum || !juz))}>
        {isPending ? 'Saving…' : 'Save progress'}
      </Button>
    </form>
  )
}
