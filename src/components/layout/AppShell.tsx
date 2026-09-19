import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { MobileNavigation } from './MobileNavigation'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'

export function AppShell() {
  useEffect(() => {
    document.title = 'NO CAP — Rumours, Reviewed.'
  }, [])

  return (
    <div className="relative flex min-h-screen min-w-0 overflow-x-hidden bg-canvas text-ink">
      {/* Subtle atmospheric ambient glow */}
      <div className="ambient-glow-orb-1" aria-hidden="true" />
      <div className="ambient-glow-orb-2" aria-hidden="true" />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-cyan focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopHeader />
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-12"
        >
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  )
}
