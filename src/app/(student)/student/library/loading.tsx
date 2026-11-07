import { CardSkeleton } from '@/components/shared/PageSkeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="w-24 h-6 bg-slate-200 rounded animate-pulse" />
        <div className="w-52 h-3.5 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  )
}
