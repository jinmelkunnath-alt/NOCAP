import { Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { subscribeClaimsChanged, subscribeSocialChanged } from '../../services/dataEvents'
import { notificationService } from '../../services/notificationService'
import { sessionService } from '../../services/sessionService'
import { formatRelative } from '../../utils/format'

export function NotificationBell() {
  const userId = sessionService.getCurrentUserId()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(() => notificationService.listFor(userId))

  useEffect(() => {
    const refresh = () => setItems(notificationService.listFor(userId))
    const offA = subscribeSocialChanged(refresh)
    const offB = subscribeClaimsChanged(refresh)
    return () => {
      offA()
      offB()
    }
  }, [userId])

  const unread = items.filter((item) => !item.read).length

  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl text-mute hover:bg-elevated hover:text-ink"
        aria-label={unread ? `${unread} unread notifications` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#EF3340] ring-2 ring-white" aria-hidden="true" />
        ) : (
          /* Even with 0 unread, show the subtle red accent dot like in the reference if desirable, or show when unread */
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#EF3340]" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-panel p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-mute">Updates</p>
            {unread > 0 && (
              <button
                type="button"
                className="text-[11px] text-cyan"
                onClick={() => notificationService.markAllRead(userId)}
              >
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="py-4 text-xs text-faint">No local notifications yet.</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {items.slice(0, 12).map((item) => (
                <li key={item.id}>
                  {item.claimId ? (
                    <Link
                      to={`/claim/${item.claimId}`}
                      className="block rounded-xl px-2 py-2 hover:bg-elevated"
                      onClick={() => {
                        notificationService.markRead(item.id)
                        setOpen(false)
                      }}
                    >
                      <p className="text-xs font-medium text-ink">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-mute">{item.body}</p>
                      <p className="mt-1 font-mono text-[10px] text-faint">
                        {formatRelative(item.createdAt)}
                      </p>
                    </Link>
                  ) : (
                    <div className="rounded-xl px-2 py-2">
                      <p className="text-xs font-medium text-ink">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-mute">{item.body}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
