'use client'

export default function ActivitySkeleton() {
  return (
    <div className="tour-card overflow-hidden animate-pulse">
      <div className="h-40 w-full bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-6 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-3 w-1/3 rounded bg-slate-200" />
        <div className="h-3 w-1/4 rounded bg-slate-200" />
        <div className="h-8 w-24 rounded-xl bg-slate-200 mt-2" />
      </div>
    </div>
  )
}
