export default function LocaleLoading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent" />
        <p className="text-sm font-medium text-slate-400">جاري التحميل...</p>
      </div>
    </div>
  )
}
