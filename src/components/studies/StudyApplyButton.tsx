'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus } from 'lucide-react'

export default function StudyApplyButton({ studyId, userId }: { studyId: string; userId?: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleApply = async () => {
    if (!userId) { router.push('/auth/login'); return }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('study_applications').insert({
      study_id: studyId,
      user_id: userId,
      message: message || null,
    })

    if (err) {
      setError(err.code === '23505' ? '이미 신청한 스터디입니다.' : err.message)
      setLoading(false)
      return
    }

    // Notify study creator
    const { data: study } = await supabase
      .from('studies').select('creator_id, title').eq('id', studyId).single()
    if (study) {
      await supabase.from('notifications').insert({
        user_id: study.creator_id,
        type: 'applied',
        ref_type: 'study',
        ref_id: studyId,
        message: `"${study.title}" 스터디에 새 참여 신청이 들어왔습니다.`,
      })
    }

    router.refresh()
  }

  if (showForm) {
    return (
      <div className="space-y-3">
        <div>
          <label className="label text-xs">지원 동기 (선택)</label>
          <textarea rows={3} className="input-field text-sm resize-none"
            placeholder="스터디에 지원하는 이유나 관련 경험을 적어주세요"
            value={message} onChange={e => setMessage(e.target.value)} />
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center text-sm">취소</button>
          <button onClick={handleApply} disabled={loading} className="btn-primary flex-1 justify-center text-sm">
            <UserPlus size={15} />
            {loading ? '신청 중...' : '신청'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => setShowForm(true)} className="btn-primary w-full justify-center">
      <UserPlus size={18} /> 스터디 신청
    </button>
  )
}
