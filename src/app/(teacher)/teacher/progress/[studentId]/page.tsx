import { createClient, requireRole } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ProgressForm from './ProgressForm'
import AdvanceForm from './AdvanceForm'
import { surahName, juzProgress } from '@/lib/quran/surahs'

export default async function StudentProgressPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const supabase = await createClient()
  const user = await requireRole('teacher')

  // Everything in one round trip. The progress queries are RLS-scoped to this
  // teacher's students, and only the ones matching the student type are used.
  const admin = createAdminClient()
  const [
    { data: student },
    { data: nameRow },
    { data: assignments },
    { data: currentProgress },
    { data: snapshots },
  ] = await Promise.all([
    supabase
      .from('students')
      .select('id, student_type, profile_id, ready_to_advance, advance_note, advance_requested_at')
      .eq('id', studentId)
      .eq('teacher_id', user.id)
      .single(),
    admin.from('students').select('profiles:profile_id(full_name)').eq('id', studentId).single(),
    supabase
      .from('homework_assignments')
      .select('homework:homework_id(id, title, surah_number, created_at)')
      .eq('student_id', studentId),
    supabase
      .from('iqra_progress')
      .select('current_book, current_page, updated_at')
      .eq('student_id', studentId)
      .single(),
    supabase
      .from('progress_snapshots')
      .select('id, data, recorded_at')
      .eq('student_id', studentId)
      .order('recorded_at', { ascending: false })
      .limit(8),
  ])

  if (!student) redirect('/teacher/progress')

  const studentName = (nameRow?.profiles as any)?.full_name ?? '—'
  const studentType = student.student_type as 'iqra' | 'quran'

  if (studentType === 'quran') {
    // ── QURAN: derive progress from homework assignments ──

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
      <div className="space-y-6 max-w-xl">
        <div>
          <Link
            href="/teacher/progress"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-3"
          >
            <ArrowLeft size={14} /> All students
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">{studentName}</h1>
          <p className="text-sm text-slate-400 mt-0.5">Quran student</p>
        </div>

        {/* Current position */}
        {currentSurah && jp ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-indigo-500" />
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">Current position</p>
              </div>
              <span className="text-xs text-indigo-400 bg-indigo-100 px-2 py-0.5 rounded-full font-medium">
                Juz {jp.juz}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-900">Surah {surahName(currentSurah)}</p>
              <p className="text-sm text-indigo-500 mt-0.5">No. {currentSurah}</p>
            </div>
            {/* Juz progress bar */}
            <div>
              <div className="flex justify-between text-xs text-indigo-400 mb-1">
                <span>{jp.firstName}</span>
                <span className="font-medium text-indigo-600">{jp.pct}% of Juz {jp.juz}</span>
                <span>{jp.lastName}</span>
              </div>
              <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${jp.pct}%` }} />
              </div>
              <p className="text-xs text-indigo-400 mt-1.5">
                {jp.done} of {jp.total} surahs in Juz {jp.juz} done
                {jp.left > 0 ? ` · ${jp.left} surah${jp.left !== 1 ? 's' : ''} left to complete this Juz` : ' · Juz complete!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-700">No homework assigned yet</p>
            <p className="text-xs text-slate-400 mt-1">Progress will appear here automatically once you assign homework.</p>
          </div>
        )}

        {/* Homework timeline */}
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

  // ── IQRA: keep manual progress form ──

  const formCurrent = currentProgress
    ? { book: (currentProgress as any).current_book, page: (currentProgress as any).current_page }
    : null

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link
          href="/teacher/progress"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft size={14} /> All students
        </Link>
        <h1 className="text-xl font-semibold text-slate-900">{studentName}</h1>
        <p className="text-sm text-slate-400 capitalize mt-0.5">Iqra student</p>
      </div>

      {currentProgress && (
        <div className="bg-teal-50 border border-teal-100 rounded-lg px-4 py-3">
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">Current position</p>
          <p className="text-sm font-medium text-teal-900">
            Book {(currentProgress as any).current_book} · Page {(currentProgress as any).current_page}
          </p>
          <p className="text-xs text-teal-500 mt-0.5">
            Last updated {format(new Date((currentProgress as any).updated_at), 'd MMM yyyy')}
          </p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Update progress</CardTitle></CardHeader>
        <CardContent>
          <ProgressForm studentId={studentId} studentType="iqra" current={formCurrent} />
        </CardContent>
      </Card>

      <AdvanceForm
        studentId={studentId}
        readyToAdvance={student.ready_to_advance ?? false}
        advanceNote={student.advance_note ?? null}
        advanceRequestedAt={student.advance_requested_at ?? null}
      />

      {snapshots && snapshots.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">History</h2>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {snapshots.map(snap => (
              <div key={snap.id} className="flex items-center justify-between px-4 py-2.5">
                <p className="text-sm text-slate-700">
                  Book {(snap.data as any).book}, Page {(snap.data as any).page}
                </p>
                <p className="text-xs text-slate-400">
                  {format(new Date(snap.recorded_at), 'd MMM yyyy, h:mm a')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
