import { socialService } from '../../services/socialService'
import { Button } from '../ui/Button'

interface FollowButtonProps {
  userId: string
  following: boolean
  isSelf?: boolean
}

export function FollowButton({ userId, following, isSelf = false }: FollowButtonProps) {
  if (isSelf) return null

  return (
    <Button
      size="sm"
      variant={following ? 'secondary' : 'primary'}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        socialService.toggleFollow(userId)
      }}
      aria-pressed={following}
      aria-label={following ? 'Unfollow' : 'Follow'}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  )
}
