'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

interface Props {
  matchId: string
  className?: string
}

export default function DeleteMatchButton({ matchId, className }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('경기를 삭제하면 모든 참여 신청 내역도 함께 삭제됩니다.\n정말 삭제하시겠습니까?')) return
    setLoading(true)

    await supabase.from('sport_participants').delete().eq('match_id', matchId)
    const { error } = await supabase.from('sport_matches').delete().eq('id', matchId)

    if (error) {
      alert('삭제 중 오류가 발생했습니다: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/sports')
  }

  const defaultClass = "flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors disabled:opacity-50"

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={className ?? defaultClass}
    >
      <Trash2 size={13} />
      {loading ? '삭제 중...' : '삭제'}
    </button>
  )
}
