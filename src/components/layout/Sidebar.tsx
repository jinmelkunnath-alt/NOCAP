import {
  Bookmark,
  Bot,
  Compass,
  Home,
  LayoutDashboard,
  Newspaper,
  Plus,
  Scale,
  Flag,
  Shield,
  ShieldCheck,
  UserRound,
  Users,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useSocial } from '../../context/SocialProvider'
import { cn } from '../../utils/cn'

const MAIN_NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/feed', label: 'Feed', icon: Newspaper, end: false },
  { to: '/explore', label: 'Explore', icon: Compass, end: false },
  { to: '/trending', label: 'Trending', icon: TrendingUp, end: false },
] as const

const COMMUNITY_NAV = [
  { to: '/uploads/ai', label: 'AI Rumours', icon: Bot, end: false },
  { to: '/uploads/user', label: 'User Rumours', icon: Users, end: false },
  { to: '/saved', label: 'Saved', icon: Bookmark, end: false },
] as const

const VERIFY_NAV = [
  { to: '/submit', label: 'Check a Claim', icon: ShieldCheck, end: false },
  { to: '/courtroom/clm_001', label: 'Courtroom', icon: Scale, end: false },
  { to: '/dashboard', label: 'Insights', icon: LayoutDashboard, end: false },
  { to: '/reporting', label: 'Reporting', icon: Flag, end: false },
  { to: '/moderation', label: 'Moderation', icon: Shield, end: false },
  { to: '/decisions', label: 'Decisions', icon: FileText, end: false },
] as const

export function Sidebar() {
  const social = useSocial()
  const me = social.currentUser.username
  const displayName = social.currentUser.displayName

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('truthlens_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('truthlens_sidebar_collapsed', String(isCollapsed))
    } catch {
      // ignore
    }
  }, [isCollapsed])

  const guestCode = me.startsWith('guest_') ? me.replace('guest_', '').toUpperCase() : me.slice(0, 4).toUpperCase()
  const guestLabel = displayName.startsWith('Guest') ? displayName : `Guest_${guestCode}`

  return (
    <aside
      className={cn(
        'hidden h-screen shrink-0 flex-col overflow-y-auto border-r border-[#EAEAEA] bg-white transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:flex z-30',
        isCollapsed ? 'w-20' : 'w-64',
      )}
    >
      {/* Top Brand Header */}
      <div className={cn('p-4 border-b border-[#EAEAEA]', isCollapsed ? 'px-3' : 'px-5')}>
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
            {/* Official NO CAP Logo */}
            <img
              src="/no-cap-logo.png"
              alt="NO CAP Logo"
              className="h-9 w-9 shrink-0 object-contain"
            />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-black text-lg leading-tight tracking-wider uppercase text-[#111111]">
                  NO <span className="text-[#EF3340]">CAP</span>
                </span>
                <span className="text-[10px] leading-tight text-[#667085] mt-0.5">
                  See what&apos;s being said.<br />Check what&apos;s verified.
                </span>
              </div>
            )}

          </Link>

          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#EAEAEA] bg-[#F9FAFB] text-[#667085] hover:bg-white hover:text-[#111111] hover:border-[#D1D5DB] transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Primary CTA: + Check a Rumour */}
        <div className="mt-4">
          <Link
            to="/"
            className={cn(
              'flex items-center justify-center rounded-full bg-[#EF3340] font-semibold text-white shadow-xs transition-all duration-150 hover:bg-[#D92D3A] active:scale-[0.98]',
              isCollapsed ? 'h-10 w-10 mx-auto' : 'w-full py-2.5 px-4 text-xs tracking-wide gap-2',
            )}
            title="Check a Rumour"
          >
            <Plus className={cn('shrink-0', isCollapsed ? 'h-5 w-5' : 'h-4 w-4')} />
            {!isCollapsed && <span>Check a Rumour</span>}
          </Link>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex flex-1 flex-col gap-5 p-3" aria-label="Primary">
        {/* Main Section */}
        <div className="space-y-0.5">
          {MAIN_NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center rounded-xl font-medium transition-all duration-150',
                    isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5 text-xs',
                    isActive
                      ? 'bg-[#FDE7E9] text-[#EF3340] font-semibold'
                      : 'text-[#475467] hover:bg-[#F9FAFB] hover:text-[#111111]',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-[#EF3340]' : 'text-[#667085] group-hover:text-[#111111]',
                      )}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>

        {/* Community Section */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              COMMUNITY
            </p>
          )}
          {COMMUNITY_NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center rounded-xl font-medium transition-all duration-150',
                    isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5 text-xs',
                    isActive
                      ? 'bg-[#FDE7E9] text-[#EF3340] font-semibold'
                      : 'text-[#475467] hover:bg-[#F9FAFB] hover:text-[#111111]',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-[#EF3340]' : 'text-[#667085] group-hover:text-[#111111]',
                      )}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                  </>
                )}
              </NavLink>
            )
          })}
          <NavLink
            to={`/profile/${me}`}
            title={isCollapsed ? 'Profile' : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center rounded-xl font-medium transition-all duration-150',
                isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5 text-xs',
                isActive
                  ? 'bg-[#FDE7E9] text-[#EF3340] font-semibold'
                  : 'text-[#475467] hover:bg-[#F9FAFB] hover:text-[#111111]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <UserRound
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-[#EF3340]' : 'text-[#667085] group-hover:text-[#111111]',
                  )}
                />
                {!isCollapsed && <span>Profile</span>}
              </>
            )}
          </NavLink>
        </div>

        {/* Verification Section */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              VERIFICATION
            </p>
          )}
          {VERIFY_NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center rounded-xl font-medium transition-all duration-150',
                    isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5 text-xs',
                    isActive
                      ? 'bg-[#FDE7E9] text-[#EF3340] font-semibold'
                      : 'text-[#475467] hover:bg-[#F9FAFB] hover:text-[#111111]',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-[#EF3340]' : 'text-[#667085] group-hover:text-[#111111]',
                      )}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Footer System Status & User Area matching reference */}
      <div className="p-3 border-t border-[#EAEAEA] bg-white">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3 py-1">
            <span className="pulse-dot is-live h-2 w-2" title="System Online" />
            <Link to={`/profile/${me}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDE7E9] text-xs font-bold text-[#EF3340]">
                G
              </div>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#EAEAEA] bg-[#FAFAFA] p-3 space-y-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="pulse-dot is-live h-2 w-2" />
                <span className="text-[11px] font-bold text-[#111111]">System Online</span>
              </div>
              <p className="text-[10px] text-[#667085] mt-0.5">
                NO <span className="text-[#EF3340] font-semibold">CAP</span> AI<br />
                Advisory • Human Verified
              </p>

            </div>

            <div className="flex items-center justify-between border-t border-[#EAEAEA] pt-2">
              <Link to={`/profile/${me}`} className="flex items-center gap-2 overflow-hidden hover:opacity-80">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FDE7E9] text-xs font-bold text-[#EF3340]">
                  G
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#111111]">{guestLabel}</p>
                  <p className="text-[10px] text-[#667085]">Community Explorer</p>
                </div>
              </Link>
              <Link to={`/profile/${me}`} className="text-[#9CA3AF] hover:text-[#111111]">
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
