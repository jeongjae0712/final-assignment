'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DEPARTMENTS } from '@/lib/utils'
import { UserPlus, UserMinus } from 'lucide-react'

interface Props {
  matchId: string
  matchMode?: 'department' | 'individual'
  deptHost?: string | null
  deptGuest?: string | null
  userId?: string
  participantId?: string
  mode: 'join' | 'cancel'
}

export default function SportJoinButton({
  matchId, matchMode, deptHost, deptGuest, userId, participantId, mode,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [intro, setIntro] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleJoin = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: profile } = await supabase
      .from('users')
      .select('department')
      .eq('id', user.id)
      .single()

    let teamSide = 'individual'

    if (matchMode === 'department') {
      if (profile?.department === deptHost) {
        teamSide = 'host'
      } else if (!deptGuest || profile?.department === deptGuest) {
        teamSide = 'guest'
        // If dept_guest was null, update it now
        if (!deptGuest) {
          await supabase
            .from('sport_matches')
            .update({ dept_guest: profile?.department })
            .eq('id', matchId)
        }
      } else {
        setError('이 경기는 특정 학과 간 대항전입니다.')
        setLoading(false)
        return
      }
    }

    const { error: err } = await supabase.from('sport_participants').insert({
      match_id: matchId,
      user_id: user.id,
      team_side: teamSide,
      intro: intro || null,
    })

    if (err) {
      setError(err.code === '23505' ? '이미 참여 신청한 경기입니다.' : err.message)
      setLoading(false)
      return
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
        <div>
          <label className="label text-xs">한 줄 자기소개 (선택)</label>
          <input
            type="text"
            className="input-field text-sm"
            placeholder="예: 농구 3년차, 포지션 포워드"
            value={intro}
            onChange={e => setIntro(e.target.value)}
          />
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center text-sm">
            취소
          </button>
          <button onClick={handleJoin} disabled={loading} className="btn-primary flex-1 justify-center text-sm">
            <UserPlus size={16} />
            {loading ? '신청 중...' : '신청 완료'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => setShowForm(true)}
      className="btn-primary w-full justify-center">
      <UserPlus size={18} />
      참여 신청
    </button>
  )
}
