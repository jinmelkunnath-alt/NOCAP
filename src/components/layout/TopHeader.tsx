import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, ChevronDown, UserPlus } from 'lucide-react'
import { useSocial } from '../../context/SocialProvider'
import { sessionService } from '../../services/sessionService'
import { NotificationBell } from './NotificationBell'


export function TopHeader() {
  const navigate = useNavigate()
  const social = useSocial()
  const user = social.currentUser
  const [searchQuery, setSearchQuery] = useState('')

  const guestCode = user.username.startsWith('guest_')
    ? user.username.replace('guest_', '').toUpperCase()
    : user.username.slice(0, 4).toUpperCase()
  const guestLabel = user.displayName.startsWith('Guest') ? user.displayName : `Guest_${guestCode}`

  // Support Command/Ctrl + K shortcut to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('top-search-input')?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-2 sm:gap-4 border-b border-[#EAEAEA] bg-white px-3 sm:px-6 lg:px-8">
      {/* Mobile Logo link */}
      <div className="flex items-center gap-2 lg:hidden shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/no-cap-logo.png"
            alt="NO CAP Logo"
            className="h-8 w-8 shrink-0 object-contain"
          />
          <span className="font-black text-base text-[#111111] uppercase tracking-wider">
            NO <span className="text-[#EF3340]">CAP</span>
          </span>
        </Link>
      </div>

      {/* Center Search Bar: Full available width, fluid responsive element */}
      <div className="flex-1 min-w-0 px-2 sm:px-5 lg:px-6 flex items-center">
        <form onSubmit={handleSearch} className="relative flex items-center w-full">
          <Search className="absolute left-3.5 h-4 w-4 text-[#9CA3AF]" aria-hidden="true" />
          <input
            id="top-search-input"
            type="text"
            placeholder="Search rumours, topics or people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-[#EAEAEA] bg-[#FAFAFA] pl-10 pr-9 sm:pr-14 text-xs sm:text-sm text-[#111111] placeholder:text-[#9CA3AF] transition-all focus:border-[#EF3340]/30 focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#EF3340]/10 focus:shadow-[0_0_0_3px_rgba(239,51,64,0.06)]"
          />
          <kbd className="hidden md:flex absolute right-3.5 items-center gap-0.5 rounded border border-[#EAEAEA] bg-white px-1.5 py-0.5 text-[10px] font-mono text-[#9CA3AF]">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </form>
      </div>

      {/* Right Controls matching reference: Notification with red dot, Guest pill with avatar */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Notification Bell */}
        <div className="relative">
          <NotificationBell />
        </div>

        {/* Guest identity dropdown & Switcher for multi-user demo */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Link
            to={`/profile/${user.username}`}
            className="flex items-center gap-1.5 sm:gap-2.5 rounded-full border border-[#EAEAEA] bg-[#FAFAFA] py-1 pl-1 sm:pl-1.5 pr-2 sm:pr-3 transition-colors hover:bg-white hover:border-[#D1D5DB]"
            title="Current Guest Identity"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FDE7E9] text-xs font-bold text-[#EF3340]">
              G
            </div>
            <span className="hidden sm:inline text-xs font-bold text-[#111111]">{guestLabel}</span>
            <ChevronDown className="hidden sm:inline h-3.5 w-3.5 text-[#9CA3AF]" />
          </Link>

          <button
            type="button"
            onClick={() => sessionService.switchGuest()}
            title="Switch to another Guest ID (for Demo 3 multi-user rumour checks)"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#EAEAEA] bg-[#FAFAFA] text-[#667085] hover:bg-white hover:text-[#EF3340] hover:border-[#EF3340]/30 transition-colors"
            aria-label="Switch guest identity"
          >
            <UserPlus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

