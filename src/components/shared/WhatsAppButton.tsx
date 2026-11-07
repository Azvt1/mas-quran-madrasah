'use client'

import { useState } from 'react'
import { MessageCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

interface Props {
  parentPhone: string | null
  studentName: string
  /** Optional pre-fill for the message body */
  prefillMessage?: string
}

function normalizePhone(raw: string): string {
  // Strip everything except digits and leading +
  return raw.replace(/[^\d+]/g, '').replace(/^\+/, '')
}

export default function WhatsAppButton({ parentPhone, studentName, prefillMessage }: Props) {
  const [open, setOpen]       = useState(false)
  const [message, setMessage] = useState(
    prefillMessage ??
    `Assalamu Alaykum,\n\nThis is a message from the madrasa regarding ${studentName}.\n\n`
  )

  if (!parentPhone) {
    return (
      <p className="text-xs text-slate-400 italic">
        No parent number — add it in Admin → Users.
      </p>
    )
  }

  const phone  = normalizePhone(parentPhone)
  const waUrl  = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors"
      >
        {/* WhatsApp icon SVG inline — no external dependency */}
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-green-600" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.558 4.121 1.532 5.849L.057 23.569a.75.75 0 0 0 .92.92l5.864-1.462A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.704 9.704 0 0 1-4.951-1.353l-.355-.211-3.68.917.934-3.592-.232-.369A9.709 9.709 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
        </svg>
        Message parent
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {open && (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
          <p className="text-xs text-slate-500">
            Sending to <span className="font-medium text-slate-700">{parentPhone}</span>
          </p>
          <textarea
            rows={5}
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-400 resize-none"
          />
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md transition-colors"
          >
            <ExternalLink size={12} />
            Open in WhatsApp
          </a>
          <p className="text-[10px] text-slate-400">WhatsApp will open with the message ready — just tap Send.</p>
        </div>
      )}
    </div>
  )
}
