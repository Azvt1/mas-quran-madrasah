import { createClient, requireRole } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { BookOpen, TrendingUp } from 'lucide-react'
import { surahName, juzProgress } from '@/lib/quran/surahs'

export default async function StudentProgressPage() {
  const supabase = await createClient()
  const user = await requireRole('student')

  const { data: student } = await supabase
    .from('students')
    .select('id, student_type')
    .eq('profile_id', user.id)
    .single()

  if (!student) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Progress</h1>
        <p className="text-sm text-slate-500">No student record found. Contact your admin.</p>
      </div>
    )
  }

  const studentType = student.student_type as 'iqra' | 'quran'

  if (studentType === 'quran') {
    // Derive progress from homework (MIN surah_number = most advanced position)
    const { data: assignments } = await supabase
      .from('homework_assignments')
      .select('homework:homework_id(id, title, surah_number, created_at)')
      .eq('student_id', student.id)

    type HwRow = { id: string; title: string; surah_number: number | null; created_at: string }
    const homeworks: HwRow[] = (assignments ?? [])
      .map((a: any) => a.homework)
      .filter((h: any) => h && h.surah_number)
      .sort((a: HwRow, b: HwRow) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const currentSurah: number | null = homeworks.length
      ? Math.min(...homeworks.map(h => h.surah_number!))
      : null

    const jp = currentSurah ? juzProgress(currentSurah) : null

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My Progress</h1>
          <p className="text-sm text-slate-500 mt-0.5">Quran student</p>
        </div>

        {currentSurah && jp ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={15} className="text-indigo-500" />
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">Current position</p>
              </div>
              <span className="text-xs font-medium text-indigo-500 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                Juz {jp.juz}
              </span>
            </div>

            <div>
              <p className="text-3xl font-bold text-indigo-900">{surahName(currentSurah)}</p>
              <p className="text-sm text-indigo-500 mt-1">Surah {currentSurah}</p>
            </div>

            {/* Juz progress bar */}
            <div>
              <div className="flex justify-between text-xs text-indigo-400 mb-1.5">
                <span>{jp.firstName}</span>
                <span className="font-medium text-indigo-600">{jp.pct}% of Juz {jp.juz}</span>
                <span>{jp.lastName}</span>
              </div>
              <div className="h-3 bg-indigo-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${jp.pct}%` }} />
              </div>
              <p className="text-xs text-indigo-400 mt-1.5">
                {jp.done} of {jp.total} surahs done
                {jp.left > 0
                  ? ` · ${jp.left} surah${jp.left !== 1 ? 's' : ''} left to complete Juz ${jp.juz}`
                  : ' · Juz complete! 🎉'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-slate-200 rounded-xl">
            <div className="p-3 bg-slate-100 rounded-full mb-3">
              <TrendingUp size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No progress yet</p>
            <p className="text-xs text-slate-400 mt-1">Your progress will appear here once your teacher assigns homework.</p>
          </div>
        )}

        {/* Homework history */}
        {homeworks.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Homework history</h2>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {homeworks.map((hw, i) => (
                <div key={hw.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {i === 0 && (
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                        Latest
                      </span>
                    )}
                    <p className="text-sm text-slate-700">{hw.title}</p>
                  </div>
                  <p className="text-xs text-slate-400">{format(new Date(hw.created_at), 'd MMM yyyy')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── IQRA: manual progress ──
  const [{ data: current }, { data: snapshots }] = await Promise.all([
    supabase
      .from('iqra_progress')
      .select('current_book, current_page, updated_at')
      .eq('student_id', student.id)
      .single(),
    supabase
      .from('progress_snapshots')
      .select('id, data, recorded_at')
      .eq('student_id', student.id)
      .order('recorded_at', { ascending: false })
      .limit(10),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My Progress</h1>
        <p className="text-sm text-slate-500 mt-0.5">Iqra student</p>
      </div>

      {current ? (
        <div className="bg-teal-50 border border-teal-100 rounded-xl px-6 py-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={15} className="text-teal-600" />
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Current position</p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-3xl font-bold text-teal-800">{(current as any).current_book}</p>
              <p className="text-xs font-medium text-teal-500 mt-0.5">Book</p>
            </div>
            <div className="w-px self-stretch bg-teal-200" />
            <div>
              <p className="text-3xl font-bold text-teal-800">{(current as any).current_page}</p>
              <p className="text-xs font-medium text-teal-500 mt-0.5">Page</p>
            </div>
          </div>
          <p className="text-xs text-teal-400 mt-4">
            Last updated {format(new Date((current as any).updated_at), 'd MMM yyyy')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-slate-200 rounded-xl">
          <div className="p-3 bg-slate-100 rounded-full mb-3">
            <TrendingUp size={20} className="text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">No progress recorded yet</p>
          <p className="text-xs text-slate-400 mt-1">Your teacher will update your progress after each class.</p>
        </div>
      )}

      {snapshots && snapshots.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">History</h2>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {snapshots.map((snap, idx) => (
              <div key={snap.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  {idx === 0 && (
                    <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded">
                      Latest
                    </span>
                  )}
                  <p className="text-sm text-slate-700">
                    Book {(snap.data as any).book}, Page {(snap.data as any).page}
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  {format(new Date(snap.recorded_at), 'd MMM yyyy')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
