'use client'

import { useActionState, useState } from 'react'
import { reassignStudentAction } from './actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface Props {
  studentId:          string
  currentStudentType: 'iqra' | 'quran'
  currentTeacherId:   string | null
  teachers:           { id: string; full_name: string }[]
}

export default function ReassignForm({ studentId, currentStudentType, currentTeacherId, teachers }: Props) {
  const [state, action, isPending] = useActionState(reassignStudentAction, {})
  const [studentType, setStudentType] = useState<'iqra' | 'quran'>(currentStudentType)

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="student_id" value={studentId} />

      {/* Student type */}
      <div className="space-y-2">
        <Label>Student type</Label>
        <div className="flex gap-2">
          {(['iqra', 'quran'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setStudentType(type)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border capitalize transition-colors ${
                studentType === type
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <input type="hidden" name="student_type" value={studentType} />
      </div>

      {/* Teacher selector */}
      <div className="space-y-1.5">
        <Label htmlFor="teacher_id">New teacher</Label>
        <select
          id="teacher_id"
          name="teacher_id"
          required
          defaultValue={currentTeacherId ?? ''}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
        >
          <option value="" disabled>Select a teacher…</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.full_name}</option>
          ))}
        </select>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {state.error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isPending}>
          {isPending ? 'Saving…' : 'Confirm reassignment'}
        </Button>
        <Link href="/admin/dashboard" className={buttonVariants({ variant: 'outline' })}>
          Cancel
        </Link>
      </div>
    </form>
  )
}
