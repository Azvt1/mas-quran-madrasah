'use client'

import { useState, useTransition } from 'react'
import { recordAcknowledgementAction } from './actions'

interface Props {
  assignmentId: string
  current: boolean | null // existing answer, if any
}

export default function AckButtons({ assignmentId, current }: Props) {
  const [answer, setAnswer]     = useState<boolean | null>(current)
  const [isPending, start]      = useTransition()
  const [error, setError]       = useState<string | null>(null)

  function respond(value: boolean) {
    start(async () => {
      const res = await recordAcknowledgementAction(assignmentId, value)
      if (res.success) setAnswer(value)
      else setError(res.error ?? 'Something went wrong.')
    })
  }

  if (answer !== null) {
    return (
      <div className="text-center space-y-3">
        <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-base font-semibold ${
          answer
            ? 'bg-teal-50 text-teal-700 border border-teal-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {answer ? '✅ You confirmed — JazakAllahu Khayran!' : '⏳ Noted — please listen when you can.'}
        </div>
        <p className="text-sm text-slate-400">
          You can update your response below.
        </p>
        <div className="flex gap-3 justify-center pt-1">
          <button
            onClick={() => respond(true)}
            disabled={isPending || answer === true}
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-teal-700 transition-colors"
          >
            ✅ Yes
          </button>
          <button
            onClick={() => respond(false)}
            disabled={isPending || answer === false}
            className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium disabled:opacity-40 hover:bg-slate-200 transition-colors"
          >
            ⏳ Not yet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => respond(true)}
          disabled={isPending}
          className="flex-1 py-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-base font-semibold disabled:opacity-50 transition-colors shadow-sm"
        >
          ✅ Yes, I&apos;ve listened
        </button>
        <button
          onClick={() => respond(false)}
          disabled={isPending}
          className="flex-1 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-base font-semibold disabled:opacity-50 transition-colors shadow-sm"
        >
          ⏳ Not yet
        </button>
      </div>
      <p className="text-xs text-slate-400 text-center">
        Your response will be shared with the teacher.
      </p>
    </div>
  )
}
