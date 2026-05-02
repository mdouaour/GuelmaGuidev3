import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-8 h-48 w-48 opacity-80">
        <Image
          src="https://picsum.photos/seed/guelma_404/400/400"
          alt="Not found"
          fill
          className="rounded-3xl object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-3xl">
          <span className="text-6xl font-black text-white drop-shadow-lg">404</span>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Page Not Found</h1>
      <p className="mt-4 max-w-lg text-lg text-slate-600">
        The hidden thermal baths of Guelma are beautiful, but this page seems to be lost in the forest.
      </p>
      
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/discover"
          className="rounded-xl bg-[#2E7D32] px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-[#1B5E20] hover:scale-[1.02]"
        >
          Discover Places
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Back Home
        </Link>
      </div>
    </div>
  )
}
