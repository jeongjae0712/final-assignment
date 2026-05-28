'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Clock, MessageCircle, Users, CheckCircle2 } from 'lucide-react'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import Link from 'next/link'

interface Participant {
  id: string
  team_side: string
  intro: string | null
  status: string
  joined_at: string
  user?: { id: string; name: string; department: string }
}

interface Props {
  matchId: string
  matchMode: 'department' | 'individual'
  participants: Participant[]
  deptHost?: string | null
  deptGuest?: string | null
  matchTitle?: string
}

export default function ParticipantApprovalPanel({
  matchId, matchMode, participants, deptHost, deptGuest, matchTitle,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // 알림 전송
  const notifyUser = async (userId: string, type: 'accepted' | 'rejected') => {
    const msg = type === 'accepted'
      ? `[${matchTitle ?? '경기'}] 참여가 확정됐습니다! 🎉`
      : `[${matchTitle ?? '경기'}] 이번 참여 신청이 아쉽게도 거절됐습니다.`
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      ref_type: 'sport',
      ref_id: matchId,
      message: msg,
    })
  }

  // 개인 참여자 수락/거절
  const handleStatus = async (participant: Participant, status: 'confirmed' | 'rejected') => {
    setLoadingId(participant.id)
    await supabase.from('sport_participants').update({ status }).eq('id', participant.id)
    if (participant.user?.id) {
      await notifyUser(participant.user.id, status === 'confirmed' ? 'accepted' : 'rejected')
    }
    setLoadingId(null)
    router.refresh()
  }

  // 팀 확정 처리 (학과전)
  const handleConfirmTeam = async (dept: string, teamIds: string[]) => {
    setLoadingId('team-' + dept)

    // 1) 선택된 팀 구성원 confirmed
    await supabase.from('sport_participants')
      .update({ status: 'confirmed' })
      .in('id', teamIds)

    // 2) 나머지 guest 팀 rejected
    const otherGuests = guestParticipants.filter(p => p.user?.department !== dept)
    const otherIds = otherGuests.map(p => p.id)
    if (otherIds.length > 0) {
      await supabase.from('sport_participants').update({ status: 'rejected' }).in('id', otherIds)
    }

    // 3) 경기의 dept_guest 확정
    await supabase.from('sport_matches').update({ dept_guest: dept }).eq('id', matchId)

    // 4) 확정 팀 알림 (수락)
    const confirmedMembers = guestParticipants.filter(p => teamIds.includes(p.id))
    for (const m of confirmedMembers) {
      if (m.user?.id) await notifyUser(m.user.id, 'accepted')
    }
    // 5) 거절 팀 알림
    for (const m of otherGuests) {
      if (m.user?.id) await notifyUser(m.user.id, 'rejected')
    }

    setLoadingId(null)
    router.refresh()
  }

  const handleRejectTeam = async (dept: string, teamIds: string[]) => {
    setLoadingId('reject-' + dept)
    await supabase.from('sport_participants').update({ status: 'rejected' }).in('id', teamIds)
    const rejected = guestParticipants.filter(p => teamIds.includes(p.id))
    for (const m of rejected) {
      if (m.user?.id) await notifyUser(m.user.id, 'rejected')
    }
    setLoadingId(null)
    router.refresh()
  }

  // 참여자 분류
  const hostParticipants = participants.filter(p => p.team_side === 'host')
  const guestParticipants = participants.filter(p => p.team_side === 'guest')
  const individualParticipants = participants.filter(p => p.team_side === 'individual')

  const guestByDept: Record<string, Participant[]> = {}
  for (const p of guestParticipants) {
    const dept = p.user?.department ?? '알 수 없음'
    if (!guestByDept[dept]) guestByDept[dept] = []
    guestByDept[dept].push(p)
  }

  // 학과전 렌더링
  if (matchMode === 'department') {
    const hostPending = hostParticipants.filter(p => p.status === 'pending')
    const hostDecided = hostParticipants.filter(p => p.status !== 'pending')
    const pendingTeams = Object.entries(guestByDept).filter(
      ([, members]) => members.some(m => m.status === 'pending')
    )
    const confirmedTeam = deptGuest
      ? Object.entries(guestByDept).find(([dept]) => dept === deptGuest)
      : null

    return (
      <div className="card p-5 space-y-5">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Clock size={15} className="text-amber-500" />
          참여 신청 관리
        </h3>

        {/* 주최팀 (host) 신청 */}
        {hostParticipants.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
              🔵 {deptHost} 팀 신청
            </p>
            <div className="space-y-2">
              {hostPending.map(p => (
                <ApplicantCard
                  key={p.id}
                  participant={p}
                  matchId={matchId}
                  onConfirm={() => handleStatus(p, 'confirmed')}
                  onReject={() => handleStatus(p, 'rejected')}
                  loading={loadingId === p.id}
                />
              ))}
              {hostDecided.map(p => (
                <DecidedRow key={p.id} participant={p} />
              ))}
            </div>
          </div>
        )}

        {/* 상대팀 신청 현황 */}
        <div>
          <p className="text-xs font-semibold text-purple-600 mb-2 flex items-center gap-1">
            🟣 상대팀 신청 현황
            {pendingTeams.length > 0 && !deptGuest && (
              <span className="ml-1 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {pendingTeams.length}팀 대기
              </span>
            )}
          </p>

          {confirmedTeam && (
            <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  {confirmedTeam[0]} (확정)
                </span>
                <span className="text-xs text-green-600">
                  {confirmedTeam[1].filter(p => p.status === 'confirmed').length}명
                </span>
              </div>
              <div className="space-y-1">
                {confirmedTeam[1].filter(p => p.status === 'confirmed').map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold border">
                      {p.user?.name?.[0]}
                    </div>
                    {p.user?.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingTeams.length === 0 && !confirmedTeam && (
            <p className="text-xs text-gray-400 italic py-2">아직 신청팀이 없습니다</p>
          )}

          {pendingTeams.map(([dept, members]) => {
            const pending = members.filter(m => m.status === 'pending')
            if (pending.length === 0) return null
            const rep = pending[0]
            const pendingIds = pending.map(m => m.id)
            const isLoading = loadingId === 'team-' + dept || loadingId === 'reject-' + dept

            return (
              <div key={dept} className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-700">
                      {dept[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{dept}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Users size={10} /> {pending.length}명 신청
                      </div>
                    </div>
                  </div>
                  {rep.user && (
                    <Link
                      href={`/sports/${matchId}/chat/${rep.user.id}`}
                      className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:text-primary-600 transition-colors"
                    >
                      <MessageCircle size={12} />
                      문의
                    </Link>
                  )}
                </div>

                {rep.intro ? (
                  <div className="bg-white rounded px-3 py-2 text-xs text-gray-600 border border-gray-100 mb-2">
                    <span className="text-gray-400 mr-1">💬 자기소개</span>{rep.intro}
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 italic mb-2 px-1">자기소개 없음</p>
                )}

                {pending.length > 1 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {pending.map(m => (
                      <span key={m.id} className="text-xs bg-white border border-gray-100 rounded-full px-2 py-0.5 text-gray-600">
                        {m.user?.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleRejectTeam(dept, pendingIds)}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 border border-red-100"
                  >
                    <X size={12} /> 팀 거절
                  </button>
                  <button
                    onClick={() => handleConfirmTeam(dept, pendingIds)}
                    disabled={isLoading || !!deptGuest}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 border border-green-100"
                  >
                    <Check size={12} />
                    {deptGuest ? '상대팀 확정됨' : '팀 확정'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {participants.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">아직 신청자가 없습니다</p>
        )}
      </div>
    )
  }

  // 개인전 렌더링
  const pending = individualParticipants.filter(p => p.status === 'pending')
  const decided = individualParticipants.filter(p => p.status !== 'pending')

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
        <Clock size={15} className="text-amber-500" />
        참여 신청 관리
        {pending.length > 0 && (
          <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
            대기 {pending.length}건
          </span>
        )}
      </h3>

      {participants.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">아직 신청자가 없습니다</p>
      )}

      {pending.length > 0 && (
        <div className="space-y-3 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">대기 중</p>
          {pending.map(p => (
            <ApplicantCard
              key={p.id}
              participant={p}
              matchId={matchId}
              onConfirm={() => handleStatus(p, 'confirmed')}
              onReject={() => handleStatus(p, 'rejected')}
              loading={loadingId === p.id}
            />
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">처리 완료</p>
          {decided.map(p => <DecidedRow key={p.id} participant={p} />)}
        </div>
      )}
    </div>
  )
}

function ApplicantCard({ participant: p, matchId, onConfirm, onReject, loading }: {
  participant: Participant
  matchId: string
  onConfirm: () => void
  onReject: () => void
  loading: boolean
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700 shrink-0">
          {p.user?.name?.[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900">{p.user?.name}</div>
          <div className="text-xs text-gray-500">{p.user?.department}</div>
        </div>
        <Link
          href={`/sports/${matchId}/chat/${p.user?.id}`}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-primary-600 border border-gray-200 hover:border-primary-300 rounded-lg bg-white transition-colors"
        >
          <MessageCircle size={11} /> 문의
        </Link>
      </div>

      {p.intro ? (
        <div className="bg-white rounded px-3 py-2 border border-gray-100 text-xs text-gray-600">
          <span className="text-gray-400 mr-1">💬</span>{p.intro}
        </div>
      ) : (
        <p className="text-xs text-gray-300 italic px-1">자기소개 없음</p>
      )}

      <div className="flex gap-2">
        <button onClick={onReject} disabled={loading}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 border border-red-100">
          <X size={12} /> 거절
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 border border-green-100">
          <Check size={12} /> 수락
        </button>
      </div>
    </div>
  )
}

function DecidedRow({ participant: p }: { participant: Participant }) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
        {p.user?.name?.[0] ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700 truncate">{p.user?.name}</div>
        <div className="text-xs text-gray-400 truncate">{p.user?.department}</div>
      </div>
      <span className={`badge text-xs shrink-0 ${getStatusColor(p.status)}`}>
        {getStatusLabel(p.status)}
      </span>
    </div>
  )
}