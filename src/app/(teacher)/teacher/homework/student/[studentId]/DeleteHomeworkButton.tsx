'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteHomeworkAction } from './actions'

interface Props {
  assignmentId: string
  studentId: string
}

export default function DeleteHomeworkButton({ assignmentId, studentId }: Props) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteHomeworkAction(assignmentId, studentId)
    })
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500">Delete?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {isPending ? 'Deleting…' : 'Yes'}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="p-1.5 text-slate-300 hover:text-red-400 transition-colors rounded"
      title="Delete homework"
    >
      <Trash2 size={14} />
    </button>
  )
}
