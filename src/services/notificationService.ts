import type { DeskNotification } from '../types'
import { createId } from '../utils/format'
import { emitSocialChanged } from './dataEvents'
import { verificationStorage } from './verificationStorage'

export const notificationService = {
  listFor(userId: string): DeskNotification[] {
    return verificationStorage
      .getNotifications()
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  unreadCount(userId: string): number {
    return this.listFor(userId).filter((item) => !item.read).length
  },

  push(input: { userId: string; title: string; body: string; claimId?: string }): DeskNotification {
    const item: DeskNotification = {
      id: createId('ntf'),
      userId: input.userId,
      claimId: input.claimId,
      title: input.title,
      body: input.body,
      createdAt: new Date().toISOString(),
      read: false,
    }
    verificationStorage.saveNotifications([item, ...verificationStorage.getNotifications()])
    emitSocialChanged()
    return item
  },

  markRead(id: string): void {
    const next = verificationStorage
      .getNotifications()
      .map((item) => (item.id === id ? { ...item, read: true } : item))
    verificationStorage.saveNotifications(next)
    emitSocialChanged()
  },

  markAllRead(userId: string): void {
    const next = verificationStorage
      .getNotifications()
      .map((item) => (item.userId === userId ? { ...item, read: true } : item))
    verificationStorage.saveNotifications(next)
    emitSocialChanged()
  },
}
