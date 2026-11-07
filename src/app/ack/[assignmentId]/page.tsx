import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import AckButtons from './AckButtons'

export default async function AckPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>
}) {
  const { assignmentId } = await params
  const admin = createAdminClient()

  // Load assignment with homework + student + profile
  const { data: assignment } = await admin
    .from('homework_assignments')
    .select(`
      id,
      parent_acknowledged,
      homework:homework_id ( title ),
      student:student_id (
        profile_id,
        profiles:profile_id ( full_name )
      )
    `)
    .eq('id', assignmentId)
    .single()

  if (!assignment) notFound()

  const hw          = assignment.homework as any
  const studentNode = assignment.student as any
  const profile     = studentNode?.profiles as any
  const studentName = profile?.full_name ?? 'your child'
  const title       = hw?.title ?? 'homework'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-teal-600 px-6 py-5 text-center">
          <p className="text-teal-100 text-xs font-medium uppercase tracking-widest mb-1">Quran Madrasa</p>
          <h1 className="text-white text-xl font-bold">Homework Acknowledgement</h1>
        </div>

        {/* Body */}
        <div className="px-6 py-7 space-y-6">
          <div className="text-center space-y-1">
            <p className="text-slate-500 text-sm">Assalamu Alaykum</p>
            <p className="text-slate-800 text-base font-medium">
              This is regarding <span className="text-teal-700 font-semibold">{studentName}</span>
            </p>
          </div>

          {/* Homework card */}
          <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-4 text-center space-y-1">
            <p className="text-xs text-teal-500 font-medium uppercase tracking-wide">Assigned homework</p>
            <p className="text-teal-900 font-semibold text-base">{title}</p>
          </div>

          {/* Question */}
          <div className="text-center">
            <p className="text-slate-700 text-base font-medium leading-snug">
              Have you listened to {studentName.split(' ')[0]} recite this homework?
            </p>
          </div>

          {/* Buttons */}
          <AckButtons
            assignmentId={assignmentId}
            current={assignment.parent_acknowledged ?? null}
          />
        </div>

        <p className="text-center text-xs text-slate-300 pb-5">
          MAS Madrasa · masmadrasa-murex.vercel.app
        </p>
      </div>
    </div>
  )
}
