'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users } from 'lucide-react'

interface Props {
  matchId: string
  matchMode: 'department' | 'individual'
  initialHostCount: number
  initialGuestCount: number
  initialTotalCount: number
  minPlayers: number
  maxPlayers: number
  deptHost?: string | null
  deptGuest?: string | null
}

export default function RealtimeParticipants({
  matchId, matchMode,
  initialHostCount, initialGuestCount, initialTotalCount,
  minPlayers, maxPlayers, deptHost, deptGuest,
}: Props) {
  const supabase = createClient()
  const [hostCount, setHostCount] = useState(initialHostCount)
  const [guestCount, setGuestCount] = useState(initialGuestCount)
  const [totalCount, setTotalCount] = useState(initialTotalCount)

  useEffect(() => {
    const refreshCounts = async () => {
      const { data } = await supabase
        .from('sport_participants')
        .select('team_side, status')
        .eq('match_id', matchId)

      if (data) {
        setHostCount(data.filter(p => p.team_side === 'host').length)
        setGuestCount(data.filter(p => p.team_side === 'guest').length)
        setTotalCount(data.filter(p => p.team_side === 'individual').length)
      }
    }

    const channel = supabase
      .channel(`sport-participants-${matchId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sport_participants',
        filter: `match_id=eq.${matchId}`,
      }, () => {
        refreshCounts()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId])

  if (matchMode === 'department') {
    const hostPct = Math.min((hostCount / Math.max(minPlayers, 1)) * 100, 100)
    const guestPct = Math.min((guestCount / Math.max(minPlayers, 1)) * 100, 100)
    const hostDone = hostCount >= minPlayers
    const guestDone = guestCount >= minPlayers

    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900 text-sm">실시간 참여 현황</h3>
          <span className="ml-auto text-xs text-gray-400 animate-pulse">● LIVE</span>
        </div>

        <div className="space-y-4">
          <TeamBar label={deptHost ?? '주최팀'} count={hostCount} min={minPlayers} pct={hostPct} done={hostDone} color="blue" />
          <TeamBar label={deptGuest ?? '상대팀'} count={guestCount} min={minPlayers} pct={guestPct} done={guestDone} color="purple" />
        </div>

        {hostDone && guestDone && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-center">
            <span className="text-green-700 text-xs font-semibold">🎉 매칭 조건 충족!</span>
          </div>
        )}
      </div>
    )
  }

  const pct = Math.min((totalCount / Math.max(maxPlayers, 1)) * 100, 100)
  const done = totalCount >= minPlayers

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-gray-500" />
        <h3 className="font-semibold text-gray-900 text-sm">실시간 참여 현황</h3>
        <span className="ml-auto text-xs text-gray-400 animate-pulse">● LIVE</span>
      </div>

      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600 font-medium">참여 인원</span>
        <span className={`font-bold ${done ? 'text-green-600' : 'text-gray-900'}`}>
          {totalCount} / {maxPlayers}명
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-green-500' : 'bg-primary-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">최소 {minPlayers}명 시 매칭 성사</p>

      {done && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-center">
          <span className="text-green-700 text-xs font-semibold">🎉 매칭 조건 충족!</span>
        </div>
      )}
    </div>
  )
}

function TeamBar({ label, count, min, pct, done, color }: {
  label: string; count: number; min: number; pct: number; done: boolean; color: 'blue' | 'purple'
}) {
  const colors = {
    blue: { bar: 'bg-blue-500', text: 'text-blue-700' },
    purple: { bar: 'bg-purple-500', text: 'text-purple-700' },
  }
  const c = colors[color]
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 font-medium truncate max-w-[120px]">{label}</span>
        <span className={`font-bold ${done ? 'text-green-600' : c.text}`}>{count} / {min}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-green-500' : c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
