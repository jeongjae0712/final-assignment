'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PlayCircle } from 'lucide-react'

export default function StudyActivateButton({ studyId }: { studyId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleActivate = async () => {
    if (!confirm('스터디를 시작하시겠습니까? 이후 추가 모집은 변경 가능합니다.')) return
    setLoading(true)

    await supabase
      .from('studies')
      .update({ status: 'active' })
      .eq('id', studyId)

    // Notify all accepted members
    const { data: apps } = await supabase
      .from('study_applications')
      .select('user_id, study:studies(title)')
      .eq('study_id', studyId)
      .eq('status', 'accepted')

    if (apps?.length) {
      const { data: study } = await supabase
        .from('studies').select('title').eq('id', studyId).single()

      await supabase.from('notifications').insert(
        apps.map((a: any) => ({
          user_id: a.user_id,
          type: 'matched',
          ref_type: 'study',
          ref_id: studyId,
          message: `"${study?.title}" 스터디가 시작되었습니다! 🎉`,
        }))
      )
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={handleActivate} disabled={loading}
      className="btn-primary w-full justify-center">
      <PlayCircle size={18} />
      {loading ? '처리 중...' : '스터디 시작 확정'}
    </button>
  )
}
