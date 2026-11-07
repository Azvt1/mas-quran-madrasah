'use client'

import { useRef, useEffect, useCallback } from 'react'

const ITEM_H = 44   // px per row
const VISIBLE = 5   // rows visible (selected is centre)

function Drum({
  items,
  value,
  onChange,
  label,
}: {
  items: number[]
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const ref    = useRef<HTMLDivElement>(null)
  const timer  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const padding = ITEM_H * Math.floor(VISIBLE / 2)

  // Scroll to the right item whenever the items array changes
  // (i.e. when the surah changes or `from` changes the `to` list)
  useEffect(() => {
    if (!ref.current) return
    const idx = Math.max(0, items.indexOf(value))
    ref.current.scrollTo({ top: idx * ITEM_H, behavior: 'instant' as ScrollBehavior })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const handleScroll = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (!ref.current) return
      const raw = ref.current.scrollTop / ITEM_H
      const idx = Math.round(raw)
      const clamped = Math.max(0, Math.min(idx, items.length - 1))
      // Snap to exact row
      ref.current.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
      if (items[clamped] !== value) {
        onChange(items[clamped])
      }
    }, 80)
  }, [items, value, onChange])

  return (
    <div className="flex-1 flex flex-col">
      {/* Column header */}
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-center py-2 border-b border-slate-100">
        {label}
      </p>

      {/* Drum */}
      <div className="relative" style={{ height: ITEM_H * VISIBLE }}>
        {/* Top fade */}
        <div
          className="absolute inset-x-0 top-0 z-10 pointer-events-none"
          style={{
            height: padding,
            background: 'linear-gradient(to bottom, white 0%, transparent 100%)',
          }}
        />
        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: padding,
            background: 'linear-gradient(to top, white 0%, transparent 100%)',
          }}
        />
        {/* Selection band */}
        <div
          className="absolute inset-x-3 z-10 border-y border-teal-200 bg-teal-50/70 rounded pointer-events-none"
          style={{ top: padding, height: ITEM_H }}
        />

        {/* Scrollable list */}
        <div
          ref={ref}
          onScroll={handleScroll}
          className="h-full overflow-y-scroll overscroll-contain"
          style={{
            scrollSnapType: 'y mandatory',
            paddingTop: padding,
            paddingBottom: padding,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {items.map(n => (
            <div
              key={n}
              className={`flex items-center justify-center tabular-nums select-none transition-colors duration-100 ${
                n === value
                  ? 'text-teal-700 font-bold text-base'
                  : 'text-slate-400 text-sm font-normal'
              }`}
              style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface Props {
  maxAyahs: number
  from: number
  to: number
  onFromChange: (v: number) => void
  onToChange: (v: number) => void
}

export default function AyahRangePicker({ maxAyahs, from, to, onFromChange, onToChange }: Props) {
  const fromItems = Array.from({ length: maxAyahs }, (_, i) => i + 1)
  // "to" must be >= from
  const toItems   = Array.from({ length: maxAyahs - from + 1 }, (_, i) => from + i)

  function handleFromChange(v: number) {
    onFromChange(v)
    if (to < v) onToChange(v)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex divide-x divide-slate-100">
        <Drum items={fromItems} value={from}  onChange={handleFromChange} label="Ayah from" />
        <Drum items={toItems}   value={Math.max(to, from)} onChange={onToChange}   label="Ayah to"   />
      </div>
    </div>
  )
}
