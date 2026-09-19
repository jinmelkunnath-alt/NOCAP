import { Compass, Home, PlusCircle, ShieldCheck, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useSocial } from '../../context/SocialProvider'
import { cn } from '../../utils/cn'

export function MobileNavigation() {
  const me = useSocial().currentUser.username

  const items = [
    { to: '/', label: 'Check', icon: Home, end: true },
    { to: '/explore', label: 'Explore', icon: Compass, end: false },
    { to: '/submit', label: 'Post', icon: PlusCircle, end: false, isPrimary: true },
    { to: '/review', label: 'Verify', icon: ShieldCheck, end: false },
    { to: `/profile/${me}`, label: 'Profile', icon: UserRound, end: false },
  ] as const

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-white/85 backdrop-blur-xl pb-safe lg:hidden shadow-lg shadow-slate-900/5"
      aria-label="Mobile Navigation"
    >
      <ul className="grid grid-cols-5 py-1">
        {items.map((item) => {
          const Icon = item.icon
          const isPrimary = 'isPrimary' in item && item.isPrimary
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-semibold tracking-wider transition-all duration-150',
                    isActive
                      ? 'text-emerald-700 font-bold'
                      : 'text-slate-400 hover:text-slate-700',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-full transition-transform',
                        isPrimary
                          ? 'h-8 w-8 bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                          : isActive
                            ? 'scale-110 text-emerald-700'
                            : '',
                      )}
                    >
                      <Icon className={cn('h-4 w-4', isPrimary && 'h-4 w-4')} aria-hidden="true" />
                    </div>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
