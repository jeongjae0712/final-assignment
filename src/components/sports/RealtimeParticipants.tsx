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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sport_participants', filter: `match_id=eq.${matchId}` }, refreshCounts)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [matchId])

  /* ── 학과 대항전: 인원 수는 참고용, 양 팀 참여 여부가 조건 ── */
  if (matchMode === 'department') {
    const bothTeamsIn = hostCount > 0 && guestCount > 0

    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900 text-sm">실시간 참여 현황</h3>
          <span className="ml-auto text-xs text-gray-400 animate-pulse">● LIVE</span>
        </div>

        <div className="space-y-3">
          <TeamCountRow
            label={deptHost ?? '주최팀'}
            count={hostCount}
            recommended={minPlayers}
            color="blue"
          />
          <TeamCountRow
            label={deptGuest ?? '상대팀'}
            count={guestCount}
            recommended={minPlayers}
            color="purple"
          />
        </div>

        <p className="text-xs text-gray-400 mt-3">
          팀당 권장 인원: {minPlayers}~{maxPlayers}명 (참고용)
        </p>

        {bothTeamsIn && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-center">
            <span className="text-green-700 text-xs font-semibold">🎉 양 팀 모두 참여 중!</span>
          </div>
        )}
      </div>
    )
  }

  /* ── 개인 매칭: 최소 인원 달성이 매칭 조건 ── */
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

function TeamCountRow({ label, count, recommended, color }: {
  label: string; count: number; recommended: number; color: 'blue' | 'purple'
}) {
  const colorMap = {
    blue: 'text-blue-700 bg-blue-50 border-blue-100',
    purple: 'text-purple-700 bg-purple-50 border-purple-100',
  }
  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-2 border ${colorMap[color]}`}>
      <span className="text-sm font-medium truncate max-w-[130px]">{label}</span>
      <div className="text-right shrink-0">
        <span className="text-lg font-bold">{count}</span>
        <span className="text-xs ml-1 opacity-60">명 참여</span>
      </div>
    </div>
  )
}