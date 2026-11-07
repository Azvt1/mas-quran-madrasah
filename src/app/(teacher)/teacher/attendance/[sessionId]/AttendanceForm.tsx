'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveAttendanceAction, type AttendanceRecord } from './actions'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

type Status = 'present' | 'late' | 'absent'

interface Student {
  id: string
  full_name: string
  student_type: string
}

interface ExistingRecord {
  student_id: string
  status: Status
  notes: string | null
}

interface Props {
  sessionId: string
  students: Student[]
  existing: ExistingRecord[]
}

const STATUS_OPTIONS: { value: Status; label: string; color: string; active: string }[] = [
  { value: 'present',  label: 'Present',  color: 'border-slate-200 text-slate-600', active: 'border-teal-400 bg-teal-50 text-teal-700' },
  { value: 'late',   label: 'Late',   color: 'border-slate-200 text-slate-600', active: 'border-amber-400 bg-amber-50 text-amber-700' },
  { value: 'absent', label: 'Absent', color: 'border-slate-200 text-slate-600', active: 'border-red-300 bg-red-50 text-red-600' },
]

export default function AttendanceForm({ sessionId, students, existing }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Build initial state from existing records
  const initialStatuses = Object.fromEntries(
    existing.map(r => [r.student_id, r.status])
  ) as Record<string, Status>

  const initialNotes = Object.fromEntries(
    existing.map(r => [r.student_id, r.notes ?? ''])
  ) as Record<string, string>

  const [statuses, setStatuses] = useState<Record<string, Status>>(initialStatuses)
  const [notes, setNotes]       = useState<Record<string, string>>(initialNotes)

  function setStatus(studentId: string, status: Status) {
    setStatuses(prev => ({ ...prev, [studentId]: status }))
    setSaved(false)
  }

  function setNote(studentId: string, note: string) {
    setNotes(prev => ({ ...prev, [studentId]: note }))
    setSaved(false)
  }

  function handleSubmit() {
    setError(null)

    const records: AttendanceRecord[] = students
      .filter(s => statuses[s.id])
      .map(s => ({
        studentId: s.id,
        status:    statuses[s.id],
        notes:     notes[s.id],
      }))

    if (records.length === 0) {
      setError('Mark at least one student before saving.')
      return
    }

    startTransition(async () => {
      const result = await saveAttendanceAction(sessionId, records)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  const markedCount = students.filter(s => statuses[s.id]).length

  return (
    <div className="space-y-4">
      {/* Student list */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
        {students.map(student => (
          <div key={student.id} className="px-4 py-4">
            {/* Name row */}
            <div className="mb-2">
              <p className="text-sm font-medium text-slate-900">{student.full_name}</p>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{student.student_type}</p>
            </div>

            {/* Status buttons — wrap freely on mobile */}
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(student.id, opt.value)}
                  className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                    statuses[student.id] === opt.value ? opt.active : opt.color + ' hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Notes — only show when a status is selected */}
            {statuses[student.id] && (
              <input
                type="text"
                placeholder="Add a note (optional)"
                value={notes[student.id] ?? ''}
                onChange={e => setNote(student.id, e.target.value)}
                className="mt-2 w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-md text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
              />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
          {error}
        </p>
      )}

      {/* Save row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {markedCount} of {students.length} marked
        </p>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-teal-600 font-medium">
              <CheckCircle2 size={13} />
              Saved
            </span>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isPending || markedCount === 0}
            className="bg-teal-600 hover:bg-teal-700"
            size="sm"
          >
            {isPending ? 'Saving…' : 'Save attendance'}
          </Button>
        </div>
      </div>
    </div>
  )
}
