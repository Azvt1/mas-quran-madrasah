import { ListSkeleton } from '@/components/shared/PageSkeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="w-28 h-6 bg-slate-200 rounded animate-pulse" />
      <ListSkeleton rows={6} />
    </div>
  )
}
