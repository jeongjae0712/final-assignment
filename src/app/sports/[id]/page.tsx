import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, MapPin, Calendar, Users, Clock } from 'lucide-react'
import { formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils'
import SportJoinButton from '@/components/sports/SportJoinButton'
import RealtimeParticipants from '@/components/sports/RealtimeParticipants'

export default async function SportMatchDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: match } = await supabase
    .from('sport_matches')
    .select(`
      *,
      creator:users(id, name, department),
      sport_participants(
        id, team_side, status, intro, joined_at,
        user:users(id, name, department)
      )
    `)
    .eq('id', params.id)
    .single()

  if (!match) notFound()

  const myParticipation = match.sport_participants?.find(
    (p: any) => p.user?.id === user?.id
  )

  const hostParticipants = match.sport_participants?.filter(
    (p: any) => p.team_side === 'host'
  ) ?? []
  const guestParticipants = match.sport_participants?.filter(
    (p: any) => p.team_side === 'guest'
  ) ?? []
  const individualParticipants = match.sport_participants?.filter(
    (p: any) => p.team_side === 'individual'
  ) ?? []

  const isCreator = match.creator_id === user?.id
  const isPast = new Date(match.deadline) < new Date()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/sports" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} /> 경기 목록으로
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{match.title}</h1>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-gray-100 text-gray-700">{match.sport_type}</span>
                  <span className={`badge ${match.match_mode === 'department' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {match.match_mode === 'department' ? '학과 대항전' : '개인 매칭'}
                  </span>
                </div>
                {match.match_mode === 'department' && (
                  <p className="text-lg text-gray-700 font-medium">
                    {match.dept_host} <span className="text-gray-400 mx-2">vs</span>
                    {match.dept_guest ?? <span className="text-amber-600">상대 학과 모집 중</span>}
                  </p>
                )}
              </div>
              <span className={`badge text-sm px-3 py-1 ${getStatusColor(match.status)}`}>
                {getStatusLabel(match.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={Calendar} label="경기 일시" value={formatDateTime(match.scheduled_at)} />
              <InfoRow icon={MapPin} label="장소" value={match.location} />
              <InfoRow icon={Clock} label="신청 마감" value={formatDateTime(match.deadline)} />
              <InfoRow icon={Users} label="개설자" value={`${match.creator?.name} (${match.creator?.department})`} />
            </div>

            {match.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-2">경기 설명</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{match.description}</p>
              </div>
            )}
          </div>

          {/* Participants */}
          {match.match_mode === 'department' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ParticipantTeamCard
                title={match.dept_host ?? '주최팀'}
                participants={hostParticipants}
                minPlayers={match.min_players}
                color="blue"
              />
              <ParticipantTeamCard
                title={match.dept_guest ?? '상대팀 (모집 중)'}
                participants={guestParticipants}
                minPlayers={match.min_players}
                color="purple"
              />
            </div>
          ) : (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">참여자 목록</h3>
                <span className="text-sm text-gray-500">
                  {individualParticipants.length} / {match.max_players}명
                </span>
              </div>
              <div className="space-y-2">
                {individualParticipants.map((p: any) => (
                  <ParticipantRow key={p.id} participant={p} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Real-time counter */}
          <RealtimeParticipants
            matchId={match.id}
            matchMode={match.match_mode}
            initialHostCount={hostParticipants.length}
            initialGuestCount={guestParticipants.length}
            initialTotalCount={individualParticipants.length}
            minPlayers={match.min_players}
            maxPlayers={match.max_players}
            deptHost={match.dept_host}
            deptGuest={match.dept_guest}
          />

          {/* Join / Status */}
          <div className="card p-5">
            {myParticipation ? (
              <div className="text-center">
                <div className="text-2xl mb-2">✅</div>
                <p className="font-semibold text-gray-900">참여 신청 완료</p>
                <p className={`text-sm mt-1 ${getStatusColor(myParticipation.status)} badge`}>
                  {getStatusLabel(myParticipation.status)}
                </p>
                {match.status === 'open' && !isCreator && (
                  <SportJoinButton
                    matchId={match.id}
                    participantId={myParticipation.id}
                    mode="cancel"
                  />
                )}
              </div>
            ) : match.status !== 'open' ? (
              <div className="text-center">
                <div className="text-2xl mb-2">{match.status === 'matched' ? '🎉' : '❌'}</div>
                <p className="font-semibold text-gray-700">
                  {match.status === 'matched' ? '매칭 성사됨' : '경기 취소됨'}
                </p>
              </div>
            ) : isPast ? (
              <div className="text-center">
                <p className="text-sm text-gray-500">신청 마감됨</p>
              </div>
            ) : (
              <SportJoinButton
                matchId={match.id}
                matchMode={match.match_mode}
                deptHost={match.dept_host}
                deptGuest={match.dept_guest}
                userId={user?.id}
                mode="join"
              />
            )}
          </div>

          {/* Creator actions */}
          {isCreator && match.status === 'open' && (
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">개설자 관리</p>
              <Link href={`/sports/${match.id}/edit`} className="btn-secondary w-full justify-center text-sm">
                경기 정보 수정
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-gray-600">
      <Icon size={15} className="mt-0.5 text-gray-400 shrink-0" />
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm font-medium text-gray-800">{value}</div>
      </div>
    </div>
  )
}

function ParticipantTeamCard({
  title, participants, minPlayers, color,
}: { title: string; participants: any[]; minPlayers: number; color: 'blue' | 'purple' }) {
  const colorMap = {
    blue: { bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border border-blue-100' },
    purple: { bar: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 border border-purple-100' },
  }
  const c = colorMap[color]
  const pct = Math.min((participants.length / Math.max(minPlayers, 1)) * 100, 100)

  return (
    <div className={`card p-5 ${c.badge}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="text-sm">{participants.length} / {minPlayers}</span>
      </div>
      <div className="h-1.5 bg-white/60 rounded-full mb-4 overflow-hidden">
        <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-2">
        {participants.map((p: any) => (
          <ParticipantRow key={p.id} participant={p} />
        ))}
        {participants.length === 0 && (
          <p className="text-xs text-center py-2 opacity-60">아직 참여자가 없습니다</p>
        )}
      </div>
    </div>
  )
}

function ParticipantRow({ participant }: { participant: any }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm border">
        {participant.user?.name?.[0] ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{participant.user?.name}</div>
        <div className="text-xs text-gray-400 truncate">{participant.user?.department}</div>
      </div>
      <span className={`badge text-xs ${getStatusColor(participant.status)}`}>
        {getStatusLabel(participant.status)}
      </span>
    </div>
  )
}
