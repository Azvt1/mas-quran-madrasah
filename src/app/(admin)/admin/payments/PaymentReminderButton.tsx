'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircle, X, ExternalLink, CheckCircle2 } from 'lucide-react'

export interface UnpaidParent {
  studentName: string
  phone: string
}

interface Props {
  unpaidParents: UnpaidParent[]
  termName: string
}

const DEFAULT_TEMPLATE = `Assalamu Alaykum,

This is Masjid Assalam. We are following up regarding the Quran program fees. As your child is enrolled in our program, could you please confirm if payment has been made for the current term?

If not, please let us know when you are able to arrange it.

Term fee: $100

JazakAllahu Khayran 🌙`

function buildMessage(template: string, studentName: string) {
  return template.replace(/\{name\}/g, studentName.split(' ')[0])
}

function buildWhatsAppUrl(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, '')
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}

export default function PaymentReminderButton({ unpaidParents, termName }: Props) {
  const [open, setOpen]         = useState(false)
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [sent, setSent]         = useState<Set<string>>(new Set())
  const [mounted, setMounted]   = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const withPhone = unpaidParents.filter(p => p.phone)
  const noPhone   = unpaidParents.filter(p => !p.phone)
  const sentCount = sent.size

  function markSent(phone: string) {
    setSent(prev => new Set(prev).add(phone))
  }

  if (!mounted) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={withPhone.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <MessageCircle size={15} />
        Remind unpaid parents
        {withPhone.length > 0 && (
          <span className="bg-white/20 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
            {withPhone.length}
          </span>
        )}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Payment reminders</h2>
                <p className="text-xs text-slate-400 mt-0.5">{termName} · {withPhone.length} parents with phone numbers</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            {/* Message template */}
            <div className="px-5 py-4 border-b border-slate-100 shrink-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Message template
              </p>
              <textarea
                value={template}
                onChange={e => setTemplate(e.target.value)}
                rows={7}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono leading-relaxed"
              />
            </div>

            {/* Parent list */}
            <div className="flex-1 overflow-y-auto">
              {withPhone.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No phone numbers on file for unpaid parents.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {withPhone.map(p => {
                    const isSent = sent.has(p.studentName)
                    const msg    = buildMessage(template, p.studentName)
                    const url    = buildWhatsAppUrl(p.phone, msg)
                    return (
                      <div key={p.studentName} className={`flex items-center justify-between px-5 py-3 ${isSent ? 'bg-green-50/50' : ''}`}>
                        <div>
                          <p className={`text-sm font-medium ${isSent ? 'text-green-700' : 'text-slate-900'}`}>
                            {p.studentName}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{p.phone}</p>
                        </div>
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 size={13} /> Sent
                          </span>
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markSent(p.studentName)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                          >
                            <ExternalLink size={11} />
                            Open WhatsApp
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {noPhone.length > 0 && (
                <div className="px-5 py-3 bg-amber-50/60 border-t border-amber-100">
                  <p className="text-xs text-amber-700 font-medium">No phone number on file:</p>
                  <p className="text-xs text-amber-600 mt-0.5">{noPhone.map(p => p.studentName).join(', ')}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 shrink-0 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs text-slate-400">
                {sentCount > 0 ? `${sentCount} of ${withPhone.length} sent` : 'Click each parent to open WhatsApp'}
              </p>
              <button onClick={() => setOpen(false)}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
