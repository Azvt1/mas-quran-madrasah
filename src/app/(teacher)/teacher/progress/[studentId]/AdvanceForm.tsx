'use client'

import { useActionState } from 'react'
import { format } from 'date-fns'
import { requestAdvanceAction, cancelAdvanceAction } from './actions'
import { ArrowRightCircle, X, Clock } from 'lucide-react'

interface Props {
  studentId:           string
  readyToAdvance:      boolean
  advanceNote:         string | null
  advanceRequestedAt:  string | null
}

export default function AdvanceForm({ studentId, readyToAdvance, advanceNote, advanceRequestedAt }: Props) {
  const [state, action, isPending] = useActionState(requestAdvanceAction, {})

  if (readyToAdvance) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">Pending transfer</p>
            </div>
            <p className="text-xs text-amber-600 mt-0.5">
              Requested {advanceRequestedAt ? format(new Date(advanceRequestedAt), 'd MMM yyyy') : '—'} · Waiting for admin to reassign.
            </p>
            {advanceNote && (
              <p className="text-xs text-amber-700 mt-2 bg-amber-100 rounded px-2 py-1.5 italic">
                "{advanceNote}"
              </p>
            )}
          </div>
          <form action={cancelAdvanceAction}>
            <input type="hidden" name="student_id" value={studentId} />
            <button
              type="submit"
              className="text-xs text-amber-500 hover:text-amber-700 flex items-center gap-1 shrink-0"
            >
              <X size={12} /> Cancel
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <ArrowRightCircle size={15} className="text-slate-400" />
        <p className="text-sm font-medium text-slate-700">Ready to advance to next teacher?</p>
      </div>
      <p className="text-xs text-slate-400">
        Use this when the student has completed their current book range and is ready to move on.
        The admin will be notified and will reassign the student.
      </p>

      <form action={action} className="space-y-3">
        <input type="hidden" name="student_id" value={studentId} />
        <textarea
          name="advance_note"
          rows={2}
          placeholder="Optional note for admin (e.g. completed Book 2, strong reader)"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
        />
        {state?.error && (
          <p className="text-xs text-red-500">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
        >
          <ArrowRightCircle size={14} />
          {isPending ? 'Requesting…' : 'Request advancement'}
        </button>
      </form>
    </div>
  )
}
