'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Pencil } from 'lucide-react'

interface Props {
  parentPhone: string | null
  studentName: string
  homeworkTitle: string
  isCompleted?: boolean | null
  behaviorSatisfactory?: boolean | null
  teacherFeedback?: string | null
  upcomingHomework?: string[]
}

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, '').replace(/^\+/, '')
}

function buildMessage(
  studentName: string,
  homeworkTitle: string,
  isCompleted: boolean | null | undefined,
  behaviorSatisfactory: boolean | null | undefined,
  teacherFeedback: string | null | undefined,
  upcomingHomework: string[] | undefined,
): string {
  const firstName = studentName.split(' ')[0]
  const hasFeedback = isCompleted !== null && isCompleted !== undefined

  let msg = `Assalamu Alaykum,\n\nThis is a message from the madrasa regarding ${studentName}.\n\n`

  msg += `📖 *Homework:* ${homeworkTitle}\n`
  if (hasFeedback) {
    msg += `✅ *Completed:* ${isCompleted ? 'Yes' : 'No'}\n`
    if (behaviorSatisfactory !== null && behaviorSatisfactory !== undefined) {
      msg += `🌟 *Behaviour:* ${behaviorSatisfactory ? 'Satisfactory' : 'Needs improvement'}\n`
    }
    if (teacherFeedback?.trim()) {
      msg += `\n💬 *Teacher's feedback:*\n${teacherFeedback.trim()}\n`
    }
  }

  if (upcomingHomework && upcomingHomework.length > 0) {
    msg += `\n━━━━━━━━━━━━━━━\n`
    msg += `📚 *Upcoming homework for ${firstName}:*\n`
    upcomingHomework.forEach(title => {
      msg += `• ${title}\n`
    })
  }

  msg += `\nJazakAllahu Khayran.`
  return msg
}

const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.558 4.121 1.532 5.849L.057 23.569a.75.75 0 0 0 .92.92l5.864-1.462A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.704 9.704 0 0 1-4.951-1.353l-.355-.211-3.68.917.934-3.592-.232-.369A9.709 9.709 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
  </svg>
)

export default function HomeworkWhatsAppButton({
  parentPhone,
  studentName,
  homeworkTitle,
  isCompleted,
  behaviorSatisfactory,
  teacherFeedback,
  upcomingHomework,
}: Props) {
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  if (!parentPhone) return null

  const phone       = normalizePhone(parentPhone)
  const waUrl       = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  const firstName   = studentName.split(' ')[0]
  const hasFeedback = isCompleted !== null && isCompleted !== undefined

  function handleOpen() {
    setMessage(buildMessage(studentName, homeworkTitle, isCompleted, behaviorSatisfactory, teacherFeedback, upcomingHomework))
    setEditing(false)
    setOpen(true)
  }

  const lines = message.split('\n')

  const modal = open && mounted && createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal — centred, full-width on mobile */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          style={{ pointerEvents: 'auto', maxHeight: '92vh', minHeight: '60vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* WhatsApp header — always visible */}
          <div className="bg-[#075E54] px-4 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-bold text-base">
                {firstName[0]}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{studentName}&apos;s Parent</p>
                <p className="text-[#B2DFDB] text-xs">{parentPhone}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[#B2DFDB] hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>

          {/* Chat area — scrolls */}
          <div
            className="px-4 py-4 overflow-y-auto flex-1"
            style={{
              background: '#E5DDD5',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9BEB5' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {editing ? (
              <div className="bg-white rounded-2xl shadow-sm p-3">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-2">Edit message</p>
                <textarea
                  autoFocus
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full text-sm text-slate-700 font-mono resize-none focus:outline-none leading-relaxed"
                  style={{ minHeight: '200px' }}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl rounded-tl-none shadow-sm px-4 py-3 max-w-[92%] relative">
                <div
                  className="absolute -left-2 top-0 w-0 h-0"
                  style={{ borderTop: '10px solid white', borderLeft: '10px solid transparent' }}
                />
                <div className="space-y-1 text-sm text-slate-800 leading-relaxed">
                  {lines.map((line, i) => {
                    if (!line.trim()) return <div key={i} className="h-1.5" />
                    const parts = line.split(/(\*[^*]+\*)/g)
                    return (
                      <p key={i}>
                        {parts.map((part, j) =>
                          part.startsWith('*') && part.endsWith('*')
                            ? <strong key={j}>{part.slice(1, -1)}</strong>
                            : <span key={j}>{part}</span>
                        )}
                      </p>
                    )
                  })}
                </div>
                <p className="text-[11px] text-slate-400 text-right mt-2">Now ✓✓</p>
              </div>
            )}
          </div>

          {/* Footer — always visible */}
          <div className="bg-[#F0F0F0] px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setEditing(e => !e)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full transition-colors ${
                editing
                  ? 'bg-slate-300 text-slate-700'
                  : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700 shadow-sm'
              }`}
            >
              <Pencil size={11} />
              {editing ? 'Preview' : 'Edit message'}
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 text-sm font-semibold bg-[#25D366] hover:bg-[#1ebe5d] text-white px-5 py-2 rounded-full transition-colors shadow-sm"
            >
              <WaIcon />
              Open in WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>,
    document.body
  )

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={handleOpen}
        title="Message parent about this homework"
        className={`p-1.5 rounded transition-colors ${
          hasFeedback
            ? 'text-green-500 hover:text-green-700 hover:bg-green-50'
            : 'text-slate-300 hover:text-green-600 hover:bg-green-50'
        }`}
      >
        <WaIcon />
      </button>

      {modal}
    </div>
  )
}
