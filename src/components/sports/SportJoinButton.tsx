'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, UserMinus, AlertCircle, Users } from 'lucide-react'

interface Props {
  matchId: string
  matchMode?: 'department' | 'individual'
  deptHost?: string | null
  deptGuest?: string | null
  userId?: string
  participantId?: string
  mode: 'join' | 'cancel'
  creatorId?: string   // 알림 전송용
  matchTitle?: string  // 알림 메시지용
}

export default function SportJoinButton({
  matchId, matchMode, deptHost, deptGuest, userId,
  participantId, mode, creatorId, matchTitle,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [intro, setIntro] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [myTeam, setMyTeam] = useState<'host' | 'guest' | 'none' | null>(null)
  const [myDept, setMyDept] = useState('')

  const openForm = async () => {
    if (matchMode === 'department') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('users').select('department').eq('id', user.id).single()
      const dept = profile?.department ?? ''
      setMyDept(dept)

      if (dept === deptHost) {
        setMyTeam('host')
      } else if (deptGuest && dept !== deptGuest) {
        setMyTeam('none')
      } else {
        setMyTeam('guest')
      }
    } else {
      setMyTeam('guest')
    }
    setShowForm(true)
  }

  const handleJoin = async () => {
    if (!myTeam || myTeam === 'none') return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const teamSide = matchMode === 'department'
      ? (myTeam === 'host' ? 'host' : 'guest')
      : 'individual'

    const { error: err } = await supabase.from('sport_participants').insert({
      match_id: matchId,
      user_id: user.id,
      team_side: teamSide,
      intro: intro.trim() || null,
    })

    if (err) {
      setError(err.code === '23505' ? '이미 참여 신청한 경기입니다.' : err.message)
      setLoading(false)
      return
    }

    // ── 개설자에게 신청 알림 ──────────────────────────────────
    if (creatorId && creatorId !== user.id) {
      const { data: profile } = await supabase
        .from('users').select('name, department').eq('id', user.id).single()

      const notifMsg = matchMode === 'department'
        ? `[${matchTitle ?? '경기'}] ${profile?.department ?? myDept}학과가 상대팀 참여를 신청했습니다.`
        : `[${matchTitle ?? '경기'}] ${profile?.name ?? '누군가'}님이 참여를 신청했습니다.`

      await supabase.from('notifications').insert({
        user_id:  creatorId,
        type:     'applied',
        ref_type: 'sport',
        ref_id:   matchId,
        message:  notifMsg,
      })
    }

    router.refresh()
  }

  const handleCancel = async () => {
    if (!confirm('참여를 취소하시겠습니까?')) return
    setLoading(true)
    await supabase.from('sport_participants').delete().eq('id', participantId!)
    router.refresh()
  }

  if (mode === 'cancel') {
    return (
      <button onClick={handleCancel} disabled={loading}
        className="btn-danger w-full justify-center mt-3 text-sm">
        <UserMinus size={16} />
        {loading ? '취소 중...' : '참여 취소'}
      </button>
    )
  }

  if (showForm) {
    return (
      <div className="space-y-3">
        {matchMode === 'department' && myTeam !== null && (
          <div className={`text-xs rounded-lg px-3 py-2.5 border ${
            myTeam === 'none'
              ? 'bg-red-50 text-red-600 border-red-100'
              : myTeam === 'host'
              ? 'bg-blue-50 text-blue-700 border-blue-100'
              : 'bg-purple-50 text-purple-700 border-purple-100'
          }`}>
            {myTeam === 'none' ? (
              <div className="flex items-start gap-1.5">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>
                  이미 <strong>{deptGuest}</strong>이(가) 상대팀으로 확정됐습니다.<br />
                  해당 학과 소속만 참여 가능합니다.
                </span>
              </div>
            ) : myTeam === 'host' ? (
              <div className="flex items-center gap-1.5">
                <Users size={13} />
                <span>🔵 <strong>{deptHost}</strong> 팀(주최팀)으로 신청합니다</span>
              </div>
            ) : deptGuest ? (
              <div className="flex items-center gap-1.5">
                <Users size={13} />
                <span>🟣 <strong>{deptGuest}</strong> 팀(확정 상대팀)으로 신청합니다</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Users size={13} />
                <span>
                  🟣 <strong>{myDept}</strong>으로 상대팀 신청합니다<br />
                  <span className="text-xs opacity-75">개설자가 검토 후 팀을 확정합니다</span>
                </span>
              </div>
            )}
          </div>
        )}

        {myTeam !== 'none' && (
          <>
            <div>
              <label className="label text-xs">
                자기소개 <span className="text-gray-400 font-normal">(개설자가 검토합니다)</span>
              </label>
              <textarea
                rows={3}
                className="input-field text-sm resize-none"
                placeholder={
                  matchMode === 'department' && myTeam === 'guest'
                    ? '팀 소개: 몇 명이 참여할 예정인지, 실력 수준 등을 적어주세요.'
                    : '예: 농구 3년차, 포지션 포워드, 주 3회 이상 운동합니다.'
                }
                value={intro}
                onChange={e => setIntro(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">✏️ 개설자가 자기소개를 보고 수락·거절을 결정합니다</p>
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
          </>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => { setShowForm(false); setMyTeam(null); setError('') }}
            className="btn-secondary flex-1 justify-center text-sm"
          >
            취소
          </button>
          {myTeam !== 'none' && (
            <button onClick={handleJoin} disabled={loading}
              className="btn-primary flex-1 justify-center text-sm">
              <UserPlus size={16} />
              {loading ? '신청 중...' : '신청 완료'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <button onClick={openForm} className="btn-primary w-full justify-center">
      <UserPlus size={18} />
      {matchMode === 'department' ? '팀 참여 신청' : '참여 신청'}
    </button>
  )
}
