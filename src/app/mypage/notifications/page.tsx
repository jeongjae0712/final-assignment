'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

const refTypeHref = (ref_type: string, ref_id: string) => {
  if (ref_type === 'sport') return `/sports/${ref_id}`
  if (ref_type === 'contest') return `/contests/${ref_id}`
  return `/studies/${ref_id}`
}

const typeIcon = (type: string) => {
  const map: Record<string, string> = {
    matched: '🎉', applied: '📩', accepted: '✅', rejected: '❌',
    reminder: '⏰', cancelled: '❌',
  }
  return map[type] ?? '🔔'
}

export default function NotificationsPage() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setNotifications(data ?? [])
      setLoading(false)

      // Mark all as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
    }

    fetchNotifs()

    const channel = supabase
      .channel('notifications-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mypage" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Bell size={20} /> 알림
        </h1>
        {notifications.length > 0 && (
          <span className="ml-auto text-xs text-gray-400">최근 50개</span>
        )}
      </div>

      {notifications.length ? (
        <div className="space-y-2">
          {notifications.map(notif => (
            <Link key={notif.id} href={refTypeHref(notif.ref_type, notif.ref_id)}
              className={`card p-4 flex items-start gap-3 hover:border-primary-200 transition-all ${
                !notif.is_read ? 'border-primary-300 bg-primary-50/30' : ''
              }`}>
              <span className="text-xl shrink-0">{typeIcon(notif.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 leading-snug">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notif.created_at)}</p>
              </div>
              {!notif.is_read && (
                <div className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-1.5" />
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-gray-500">알림이 없습니다</p>
        </div>
      )}
    </div>
  )
}
