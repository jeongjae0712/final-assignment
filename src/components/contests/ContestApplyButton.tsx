'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus } from 'lucide-react'

interface Props {
  contestId: string
  requiredRoles: string[]
  teamMin: number
  teamMax: number
  userId?: string
}

export default function ContestApplyButton({ contestId, requiredRoles, teamMin, teamMax, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [roleTag, setRoleTag] = useState(requiredRoles[0] ?? '')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleApply = async () => {
    if (!userId) { router.push('/auth/login'); return }
    if (!roleTag) { setError('역할을 선택해 주세요.'); return }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('contest_applications').insert({
      contest_id: contestId,
      user_id: userId,
      role_tag: roleTag,
      message: message || null,
    })

    if (err) {
      setError(err.code === '23505' ? '이미 신청한 공모전입니다.' : err.message)
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label text-xs">담당 역할 *</label>
        <select className="input-field text-sm" value={roleTag} onChange={e => setRoleTag(e.target.value)}>
          {requiredRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div>
        <label className="label text-xs">자기소개 (선택)</label>
        <textarea rows={3} className="input-field text-sm resize-none"
          placeholder="관련 경험이나 역량을 간략히 소개해 주세요"
          value={message} onChange={e => setMessage(e.target.value)} />
      </div>

      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
        팀 구성: {teamMin}~{teamMax}명 · 인원 충족 시 자동 매칭
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}

      <button onClick={handleApply} disabled={loading} className="btn-primary w-full justify-center">
        <UserPlus size={16} />
        {loading ? '신청 중...' : '팀 합류 신청'}
      </button>
    </div>
  )
}
