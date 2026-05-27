import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import MatchChat from '@/components/sports/MatchChat'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>
}) {
  const { id: matchId, userId: otherUserId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: match } = await supabase
    .from('sport_matches')
    .select('id, title, sport_type, creator_id')
    .eq('id', matchId)
    .single()
  if (!match) notFound()

  // 접근 권한: 개설자 or 참여자
  const isCreator = match.creator_id === user.id
  if (!isCreator) {
    const { data: part } = await supabase
      .from('sport_participants')
      .select('id')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .single()
    if (!part) redirect(`/sports/${matchId}`)
  }

  // 상대방 프로필
  const { data: otherUser } = await supabase
    .from('users')
    .select('id, name, department')
    .eq('id', otherUserId)
    .single()
  if (!otherUser) notFound()

  // 내 프로필 (알림 메시지용)
  const { data: myProfile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <Link
          href={`/sports/${matchId}`}
          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-700 shrink-0">
          {otherUser.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm">{otherUser.name}</div>
          <div className="text-xs text-gray-500 truncate">
            {otherUser.department}
            <span className="mx-1 text-gray-300">·</span>
            {match.title}
          </div>
        </div>
      </div>

      {/* 채팅 본문 */}
      <div className="flex-1 min-h-0">
        <MatchChat
          matchId={matchId}
          otherUserId={otherUserId}
          otherUserName={otherUser.name}
          currentUserId={user.id}
          currentUserName={myProfile?.name ?? ''}
        />
      </div>
    </div>
  )
}
