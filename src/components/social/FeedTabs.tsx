import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'

const TABS = [
  { to: '/feed', label: 'For You', end: true },
  { to: '/trending', label: 'Trending', end: false },
  { to: '/latest', label: 'Latest', end: false },
  { to: '/uploads/user', label: 'User Rumours', end: false },
  { to: '/uploads/ai', label: 'AI Discoveries', end: false },
] as const

export function FeedTabs() {
  return (
    <nav aria-label="Feed views" className="scrollbar-thin -mx-1 overflow-x-auto">
      <ul className="inline-flex min-w-max gap-1 rounded-2xl border border-line/70 bg-slate-100/90 p-1">
        {TABS.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center rounded-xl px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-150',
                  isActive
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50',
                )
              }
            >
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
