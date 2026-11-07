'use client'

import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react'

export interface StudentStat {
  id: string
  name: string
  teacherName: string
  studentType: string
  present: number
  late: number
  absent: number
  attendanceRate: number
}

export interface SessionRow {
  id: string
  session_date: string
  day_of_week: string
  present: number
  late: number
  absent: number
  isPast: boolean
}

interface Props {
  students: StudentStat[]
  sessions: SessionRow[]
  totalStudents: number
  pastSessionCount: number
  atRiskCount: number
}

export default function AttendanceTabs({
  students,
  sessions,
  totalStudents,
  pastSessionCount,
  atRiskCount,
}: Props) {
  const [tab, setTab] = useState<'students' | 'sessions'>('students')
  const [teacherFilter, setTeacherFilter] = useState<string>('all')

  // Unique teacher names for filter
  const teachers = useMemo(() => {
    const names = Array.from(new Set(students.map(s => s.teacherName))).sort()
    return names
  }, [students])

  const filteredStudents = useMemo(() =>
    teacherFilter === 'all' ? students : students.filter(s => s.teacherName === teacherFilter),
    [students, teacherFilter]
  )

  const filteredAtRisk = filteredStudents.filter(s => s.attendanceRate < 80).length

  // Group sessions by month
  const grouped = new Map<string, SessionRow[]>()
  sessions.forEach(s => {
    const month = format(parseISO(s.session_date), 'MMMM yyyy')
    if (!grouped.has(month)) grouped.set(month, [])
    grouped.get(month)!.push(s)
  })

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-6">
        <button
          onClick={() => setTab('students')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'students'
              ? 'border-teal-500 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Student attendance
          {filteredAtRisk > 0 && (
            <span className="ml-2 inline-flex items-center gap-0.5 text-xs font-medium text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">
              <AlertTriangle size={10} />
              {filteredAtRisk}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('sessions')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'sessions'
              ? 'border-teal-500 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Session breakdown
        </button>
      </div>

      {/* Student attendance tab */}
      {tab === 'students' && (
        <>
          {/* Teacher filter */}
          {teachers.length > 1 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-slate-500 font-medium">Teacher:</span>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setTeacherFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    teacherFilter === 'all'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                {teachers.map(t => (
                  <button
                    key={t}
                    onClick={() => setTeacherFilter(t)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      teacherFilter === t
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          {pastSessionCount === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-500">
              No sessions have taken place yet. Attendance data will appear here once sessions start.
            </div>
          ) : totalStudents === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-500">
              No students enrolled yet.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Student</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Teacher</th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-teal-600">Present</th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-amber-500">Late</th>
                    <th className="text-center px-3 py-2.5 text-xs font-medium text-red-500">Absent</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map(s => {
                    const isAtRisk = s.attendanceRate < 80
                    const isGood   = s.attendanceRate >= 95
                    return (
                      <tr key={s.id} className={isAtRisk ? 'bg-red-50/40' : 'hover:bg-slate-50/50'}>
                        <td className="px-4 py-3">
                          <p className={`font-medium ${isAtRisk ? 'text-red-700' : 'text-slate-900'}`}>{s.name}</p>
                          <p className="text-xs text-slate-400 capitalize">{s.studentType}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{s.teacherName}</td>
                        <td className="text-center px-3 py-3 text-teal-700 font-medium">{s.present}</td>
                        <td className="text-center px-3 py-3 text-amber-600 font-medium">{s.late}</td>
                        <td className="text-center px-3 py-3 text-red-500 font-medium">{s.absent}</td>
                        <td className="text-right px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isAtRisk ? 'bg-red-400' : isGood ? 'bg-teal-400' : 'bg-amber-400'}`}
                                style={{ width: `${s.attendanceRate}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold tabular-nums ${isAtRisk ? 'text-red-600' : isGood ? 'text-teal-600' : 'text-amber-600'}`}>
                              {s.attendanceRate}%
                            </span>
                            {isAtRisk && <AlertTriangle size={13} className="text-red-400" />}
                          </div>
                          <p className="text-right text-xs text-slate-400 mt-0.5">
                            {s.present + s.late}/{pastSessionCount} sessions
                          </p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Session breakdown tab */}
      {tab === 'sessions' && (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([month, monthSessions]) => (
            <div key={month}>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{month}</h3>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Session</th>
                      <th className="text-center px-3 py-2.5 text-xs font-medium text-teal-600">Present</th>
                      <th className="text-center px-3 py-2.5 text-xs font-medium text-amber-500">Late</th>
                      <th className="text-center px-3 py-2.5 text-xs font-medium text-red-500">Absent</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {monthSessions.map(session => {
                      const totalMarked = session.present + session.late + session.absent
                      return (
                        <tr key={session.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{format(parseISO(session.session_date), 'EEE, d MMM')}</p>
                            <p className="text-xs text-slate-400 capitalize">{session.day_of_week}</p>
                          </td>
                          <td className="text-center px-3 py-3 text-teal-700 font-medium">{session.present || '—'}</td>
                          <td className="text-center px-3 py-3 text-amber-600 font-medium">{session.late || '—'}</td>
                          <td className="text-center px-3 py-3 text-red-500 font-medium">{session.absent || '—'}</td>
                          <td className="text-right px-4 py-3">
                            {totalMarked >= totalStudents && totalStudents > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs text-teal-600 font-medium">
                                <CheckCircle2 size={12} /> Marked
                              </span>
                            ) : totalMarked > 0 ? (
                              <span className="text-xs text-amber-600 font-medium">{totalMarked}/{totalStudents}</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                                <Circle size={12} /> {session.isPast ? 'Not marked' : 'Upcoming'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
