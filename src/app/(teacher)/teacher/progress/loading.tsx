import { ListSkeleton } from '@/components/shared/PageSkeleton'

export default function Loading() {
  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-1">
        <div className="w-28 h-6 bg-slate-200 rounded animate-pulse" />
        <div className="w-56 h-3.5 bg-slate-100 rounded animate-pulse" />
      </div>
      <ListSkeleton rows={5} />
    </div>
  )
}
