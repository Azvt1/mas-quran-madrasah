'use client'

import { useState, useTransition } from 'react'
import { saveFeedbackAction } from './actions'
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  assignmentId: string
  studentId: string
  isCompleted: boolean
  existingFeedback?: {
    behavior_satisfactory: boolean | null
    teacher_feedback: string | null
  } | null
}

export default function HomeworkFeedbackForm({ assignmentId, studentId, isCompleted, existingFeedback }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  // If behavior_satisfactory was ever set, the teacher already submitted feedback —
  // show the saved isCompleted state (including false = "No"). Otherwise treat as untouched.
  const feedbackWasGiven = existingFeedback?.behavior_satisfactory !== null &&
                           existingFeedback?.behavior_satisfactory !== undefined

  const [hwDone, setHwDone]     = useState<boolean | null>(
    feedbackWasGiven ? isCompleted : (isCompleted ? true : null)
  )
  const [behavior, setBehavior] = useState<boolean | null>(existingFeedback?.behavior_satisfactory ?? null)
  const [feedback, setFeedback] = useState(existingFeedback?.teacher_feedback ?? '')

  function handleSave() {
    if (hwDone === null || behavior === null) return
    startTransition(async () => {
      await saveFeedbackAction({
        assignmentId,
        studentId,
        isCompleted: hwDone,
        behaviorSatisfactory: behavior,
        teacherFeedback: feedback.trim() || null,
      })
      setSaved(true)
      setOpen(false)
    })
  }

  // Compact summary for completed items
  const summary = isCompleted && existingFeedback
    ? [
        existingFeedback.behavior_satisfactory === true  ? '✓ Good behavior' :
        existingFeedback.behavior_satisfactory === false ? '✗ Behavior issue' : null,
        existingFeedback.teacher_feedback ? `"${existingFeedback.teacher_feedback}"` : null,
      ].filter(Boolean).join(' · ')
    : null

  return (
    <div className="shrink-0">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSaved(false) }}
        className={`inline-flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-md transition-colors ${
          isCompleted
            ? 'text-teal-600 border-teal-100 bg-teal-50 hover:bg-white hover:border-slate-200 hover:text-slate-500'
            : feedbackWasGiven
              ? 'text-red-500 border-red-100 bg-red-50 hover:bg-white hover:border-slate-200 hover:text-slate-500'
              : 'text-slate-500 border-slate-200 hover:text-teal-700 hover:border-teal-200 hover:bg-teal-50'
        }`}
      >
        <CheckCircle2 size={13} />
        {isCompleted ? 'Completed' : feedbackWasGiven ? 'Not completed' : 'Give feedback'}
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {/* Inline form */}
      {open && (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">

          {/* Homework completed? */}
          <div>
            <p className="text-xs font-medium text-slate-700 mb-1.5">Homework completed?</p>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button key={String(val)} type="button" onClick={() => setHwDone(val)}
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                    hwDone === val
                      ? val ? 'bg-teal-50 border-teal-400 text-teal-700' : 'bg-red-50 border-red-300 text-red-600'
                      : 'border-slate-200 text-slate-500 hover:bg-white'
                  }`}>
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          {/* Behavior satisfactory? */}
          <div>
            <p className="text-xs font-medium text-slate-700 mb-1.5">Behavior satisfactory?</p>
            <div className="flex gap-2">
              {[true, false].map(val => (
                <button key={String(val)} type="button" onClick={() => setBehavior(val)}
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                    behavior === val
                      ? val ? 'bg-teal-50 border-teal-400 text-teal-700' : 'bg-red-50 border-red-300 text-red-600'
                      : 'border-slate-200 text-slate-500 hover:bg-white'
                  }`}>
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback text */}
          <div>
            <p className="text-xs font-medium text-slate-700 mb-1.5">Feedback <span className="text-slate-400 font-normal">(optional)</span></p>
            <textarea
              rows={2}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="e.g. Needs to review Ayah 5 again…"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || hwDone === null || behavior === null}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600">
              Cancel
            </button>
            {saved && <span className="text-xs text-teal-600 font-medium">✓ Saved</span>}
          </div>
        </div>
      )}

      {/* Show existing feedback summary inline when closed */}
      {!open && summary && (
        <p className="text-xs text-slate-400 mt-1">{summary}</p>
      )}
    </div>
  )
}
