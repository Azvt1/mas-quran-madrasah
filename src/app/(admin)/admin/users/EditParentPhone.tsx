'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { updateParentPhoneAction } from './actions'

interface Props {
  studentId: string
  currentPhone: string | null
}

export default function EditParentPhone({ studentId, currentPhone }: Props) {
  const [editing, setEditing]   = useState(false)
  const [value, setValue]       = useState(currentPhone ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('student_id',   studentId)
      fd.set('parent_phone', value)
      await updateParentPhoneAction(fd)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="tel"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="+61 412 345 678"
          className="text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400 w-36"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
        />
        <button onClick={handleSave} disabled={isPending} className="text-teal-600 hover:text-teal-700">
          <Check size={14} />
        </button>
        <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 group">
      <span className={currentPhone ? 'text-slate-700' : 'text-slate-300'}>
        {currentPhone ?? 'Not set'}
      </span>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-teal-600 transition-opacity"
      >
        <Pencil size={12} />
      </button>
    </div>
  )
}
