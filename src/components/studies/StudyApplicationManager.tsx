'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X } from 'lucide-react'

interface Props {
  studyId: string
  applications: any[]
}

export default function StudyApplicationManager({ studyId, applications }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)

  const handleDecision = async (appId: string, userId: string, status: 'accepted' | 'rejected') => {
    setLoading(appId)

    await supabase
      .from('study_applications')
      .update({ status })
      .eq('id', appId)

    // Send notification to applicant
    const { data: study } = await supabase
      .from('studies').select('title').eq('id', studyId).single()
    if (study) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: status === 'accepted' ? 'accepted' : 'rejected',
        ref_type: 'study',
        ref_id: studyId,
        message: status === 'accepted'
          ? `"${study.title}" 스터디 참여가 수락되었습니다!`
          : `"${study.title}" 스터디 신청이 거절되었습니다.`,
      })
    }

    setLoading(null)
    router.refresh()
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 mb-4">
        신청 관리 <span className="text-amber-600">({applications.length})</span>
      </h3>
      <div className="space-y-3">
        {applications.map((app: any) => (
          <div key={app.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-sm font-bold text-gray-600 border shadow-sm shrink-0">
              {app.user?.name?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">{app.user?.name}</div>
              <div className="text-xs text-gray-500">{app.user?.department}</div>
              {app.message && (
                <p className="text-xs text-gray-600 mt-1 bg-white rounded p-2 border border-gray-100">
                  {app.message}
                </p>
              )}
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => handleDecision(app.id, app.user_id, 'accepted')}
                disabled={loading === app.id}
                className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                title="수락"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => handleDecision(app.id, app.user_id, 'rejected')}
                disabled={loading === app.id}
                className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                title="거절"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
