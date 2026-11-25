import type { Role } from '../api/types'

/** The colour class for an account's avatar: green for buyers, blush for stores, teal for admins. */
export function avatarTone(role: Role): string {
  return role === 'OWNER' ? 'orange' : role === 'ADMIN' ? 'teal' : 'lime'
}
