import { createClient, requireRole } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CheckCircle2, Circle, CreditCard } from 'lucide-react'
import { togglePaymentAction } from './actions'
import PaymentReminderButton from './PaymentReminderButton'

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  await requireRole('admin')

  const admin = createAdminClient()

  // One round trip: active term, students with student/teacher names, and
  // payments for the active term
  const [{ data: term }, { data: students }, { data: payments }] = await Promise.all([
    supabase.from('terms').select('id, name').eq('is_active', true).single(),
    admin.from('students')
      .select('id, student_type, profile_id, teacher_id, parent_phone, profiles:profile_id(full_name), teacher:teacher_id(full_name)')
      .eq('is_active', true)
      .order('enrollment_date'),
    supabase.from('term_payments')
      .select('student_id, paid, paid_at, terms!inner(is_active)')
      .eq('terms.is_active', true),
  ])

  if (!students || students.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500">No active students yet.</p>
      </div>
    )
  }

  const profileMap = new Map<string, string>()
  students.forEach(s => {
    profileMap.set(s.profile_id, (s.profiles as any)?.full_name)
    if (s.teacher_id) profileMap.set(s.teacher_id, (s.teacher as any)?.full_name)
  })
  const paymentMap = new Map((payments ?? []).map(p => [p.student_id, p]))

  // Group by teacher
  const teacherMap = new Map<string, { name: string; students: typeof students }>()
  students.forEach(s => {
    const tid = s.teacher_id ?? 'unassigned'
    if (!teacherMap.has(tid)) {
      teacherMap.set(tid, {
        name:     s.teacher_id ? (profileMap.get(s.teacher_id) ?? '—') : 'Unassigned',
        students: [],
      })
    }
    teacherMap.get(tid)!.students.push(s)
  })

  const totalStudents = students.length
  const paidCount     = (payments ?? []).filter(p => p.paid).length
  const unpaidCount   = totalStudents - paidCount

  // Build unpaid parent list for reminder button
  const unpaidParents = students
    .filter(s => !(paymentMap.get(s.id)?.paid))
    .map(s => ({
      studentName: profileMap.get(s.profile_id) ?? '—',
      phone:       (s as any).parent_phone ?? '',
    }))

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-500 mt-0.5">{term?.name ?? 'Current term'}</p>
        </div>
        <PaymentReminderButton
          unpaidParents={unpaidParents}
          termName={term?.name ?? 'Current term'}
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-4">
          <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
          <p className="text-sm font-medium text-slate-500 mt-0.5">Total students</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-4">
          <p className="text-2xl font-bold text-teal-700">{paidCount}</p>
          <p className="text-sm font-medium text-teal-600 mt-0.5">Paid</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-4">
          <p className="text-2xl font-bold text-red-600">{unpaidCount}</p>
          <p className="text-sm font-medium text-red-500 mt-0.5">Unpaid</p>
        </div>
      </div>

      {/* Per teacher */}
      {Array.from(teacherMap.entries()).map(([teacherId, teacher]) => {
        const teacherPaid   = teacher.students.filter(s => paymentMap.get(s.id)?.paid).length
        const teacherTotal  = teacher.students.length
        const allPaid       = teacherPaid === teacherTotal

        return (
          <div key={teacherId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{teacher.name}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                allPaid
                  ? 'bg-teal-50 text-teal-600 border border-teal-100'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {teacherPaid}/{teacherTotal} paid
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              {teacher.students.map(s => {
                const payment = paymentMap.get(s.id)
                const isPaid  = payment?.paid ?? false

                return (
                  <div key={s.id} className={`flex items-center justify-between px-4 py-3 ${isPaid ? 'bg-teal-50/30' : ''}`}>
                    <div className="flex items-center gap-3">
                      {isPaid
                        ? <CheckCircle2 size={16} className="text-teal-500 shrink-0" />
                        : <Circle      size={16} className="text-slate-300 shrink-0" />
                      }
                      <div>
                        <p className="text-sm font-medium text-slate-900">{profileMap.get(s.profile_id) ?? '—'}</p>
                        <p className="text-xs text-slate-400 capitalize mt-0.5">{s.student_type}</p>
                      </div>
                    </div>

                    <form action={togglePaymentAction}>
                      <input type="hidden" name="studentId" value={s.id} />
                      <input type="hidden" name="termId"    value={term?.id ?? ''} />
                      <input type="hidden" name="paid"      value={String(isPaid)} />
                      <button
                        type="submit"
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                          isPaid
                            ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <CreditCard size={11} />
                        {isPaid ? 'Paid' : 'Mark paid'}
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
