import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, MapPin, Calendar, Users, Clock, MessageCircle, Crown, Edit2 } from 'lucide-react'
import { formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils'
import SportJoinButton from '@/components/sports/SportJoinButton'
import RealtimeParticipants from '@/components/sports/RealtimeParticipants'
import ParticipantApprovalPanel from '@/components/sports/ParticipantApprovalPanel'
import DeleteMatchButton from '@/components/sports/DeleteMatchButton'

export default async function SportMatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
    .eq('id', id)
    .single()

  if (!match) notFound()

  const isCreator = match.creator_id === user?.id

  const allParticipants = (match.sport_participants ?? []) as any[]
  const nonCreatorParticipants = allParticipants.filter((p: any) => p.user?.id !== match.creator_id)

  const myParticipation = !isCreator
    ? nonCreatorParticipants.find((p: any) => p.user?.id === user?.id)
    : null

  const hostParticipants = nonCreatorParticipants.filter((p: any) => p.team_side === 'host')
  const guestParticipants = nonCreatorParticipants.filter((p: any) => p.team_side === 'guest')
  const individualParticipants = nonCreatorParticipants.filter((p: any) => p.team_side === 'individual')
  const isPast = new Date(match.deadline) < new Date()

  const guestByDept: Record<string, any[]> = {}
  for (const p of guestParticipants as any[]) {
    const dept = (p as any).user?.department ?? '알 수 없음'
    if (!guestByDept[dept]) guestByDept[dept] = []
    guestByDept[dept].push(p)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/sports" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} /> 경기 목록으로
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 정보 */}
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
                    {match.dept_host}
                    <span className="text-gray-400 mx-2">vs</span>
                    {match.dept_guest
                      ? <span className="text-gray-700">{match.dept_guest}</span>
                      : <span className="text-amber-600 text-base">상대팀 미정</span>
                    }
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

            {match.match_mode === 'department' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  권장 참여 인원: <span className="font-medium text-gray-700">{match.min_players}~{match.max_players}명</span>
                  <span className="ml-1 text-gray-400">(참고용)</span>
                </p>
              </div>
            )}

            {match.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-2">경기 설명</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{match.description}</p>
              </div>
            )}
          </div>

          {/* 참여자 현황 */}
          {match.match_mode === 'department' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-5 bg-blue-50 border-blue-100 text-blue-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">🔵 {match.dept_host ?? '홈팀'}</h3>
                  <span className="text-2xl font-bold text-blue-600">
                    {hostParticipants.length}<span className="text-xs font-normal ml-0.5">명</span>
                  </span>
                </div>
                <p className="text-xs opacity-50 mb-3">권장 {match.min_players}~{match.max_players}명</p>
                <div className="space-y-2">
                  {hostParticipants.map((p: any) => (
                    <ParticipantRow key={p.id} participant={p} matchId={match.id} isCreator={isCreator} currentUserId={user?.id} />
                  ))}
                  {hostParticipants.length === 0 && (
                    <p className="text-xs text-center py-2 opacity-60">아직 참여자가 없습니다</p>
                  )}
                </div>
              </div>

              {match.dept_guest ? (
                <div className="card p-5 bg-purple-50 border-purple-100 text-purple-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">🟣 {match.dept_guest}</h3>
                    <span className="text-2xl font-bold text-purple-600">
                      {guestParticipants.filter((p: any) => p.status === 'confirmed').length}
                      <span className="text-xs font-normal ml-0.5">명</span>
                    </span>
                  </div>
                  <p className="text-xs opacity-50 mb-3">권장 {match.min_players}~{match.max_players}명</p>
                  <div className="space-y-2">
                    {guestParticipants.filter((p: any) => p.status === 'confirmed').map((p: any) => (
                      <ParticipantRow key={p.id} participant={p} matchId={match.id} isCreator={isCreator} currentUserId={user?.id} />
                    ))}
                    {guestParticipants.filter((p: any) => p.status === 'confirmed').length === 0 && (
                      <p className="text-xs text-center py-2 opacity-60">아직 참여자가 없습니다</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card p-5 bg-gray-50 border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-gray-700">🟣 상대팀 신청 현황</h3>
                    <span className="text-sm font-bold text-amber-600">
                      {Object.keys(guestByDept).length}팀 신청
                    </span>
                  </div>
                  {Object.keys(guestByDept).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">아직 신청한 팀이 없습니다</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(guestByDept).map(([dept, members]: [string, any[]]) => (
                        <div key={dept} className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">{dept}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{members.length}명 신청</span>
                              {isCreator && members[0]?.user && (
                                <Link
                                  href={`/sports/${match.id}/chat/${members[0].user.id}`}
                                  className="flex items-center gap-0.5 text-xs text-primary-600 hover:text-primary-700"
                                >
                                  <MessageCircle size={12} /> 채팅
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">개설자가 팀을 직접 선정합니다</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">참여자 목록</h3>
                <span className="text-sm text-gray-500">{individualParticipants.length} / {match.max_players}명</span>
              </div>
              <div className="space-y-2">
                {individualParticipants.map((p: any) => (
                  <ParticipantRow key={p.id} participant={p} matchId={match.id} isCreator={isCreator} currentUserId={user?.id} />
                ))}
                {individualParticipants.length === 0 && (
                  <p className="text-xs text-center text-gray-400 py-3">아직 참여자가 없습니다</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          <RealtimeParticipants
            matchId={match.id}
            matchMode={match.match_mode}
            initialHostCount={hostParticipants.length}
            initialGuestCount={guestParticipants.filter((p: any) => p.status === 'confirmed').length}
            initialTotalCount={individualParticipants.length}
            minPlayers={match.min_players}
            maxPlayers={match.max_players}
            deptHost={match.dept_host}
            deptGuest={match.dept_guest}
          />

          {/* 상태 카드 */}
          <div className="card p-5">
            {isCreator ? (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                  <Crown size={22} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">내가 개설한 경기</p>
                  <p className="text-xs text-gray-500 mt-0.5">주최자로서 경기를 관리합니다</p>
                </div>
                {match.status === 'open' && (
                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/sports/${match.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 size={14} /> 수정
                    </Link>
                    <DeleteMatchButton
                      matchId={match.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    />
                  </div>
                )}
              </div>
            ) : myParticipation ? (
              <div className="text-center space-y-2">
                <div className="text-2xl">
                  {myParticipation.status === 'confirmed' ? '✅' :
                   myParticipation.status === 'rejected' ? '❌' : '⏳'}
                </div>
                <p className="font-semibold text-gray-900">
                  {myParticipation.status === 'confirmed' ? '참여 확정!' :
                   myParticipation.status === 'rejected' ? '참여 거절됨' : '검토 대기 중'}
                </p>
                <span className={`badge inline-block text-sm ${getStatusColor(myParticipation.status)}`}>
                  {getStatusLabel(myParticipation.status)}
                </span>
                {myParticipation.intro && (
                  <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded px-2 py-1.5 text-left">
                    💬 {myParticipation.intro}
                  </p>
                )}
                <Link
                  href={`/sports/${match.id}/chat/${match.creator_id}`}
                  className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 text-sm text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <MessageCircle size={15} />
                  개설자에게 문의
                </Link>
                {match.status === 'open' && myParticipation.status !== 'rejected' && (
                  <SportJoinButton matchId={match.id} participantId={myParticipation.id} mode="cancel" />
                )}
              </div>
            ) : match.status !== 'open' ? (
              <div className="text-center">
                <div className="text-2xl mb-2">{match.status === 'matched' ? '🎉' : '🔒'}</div>
                <p className="font-semibold text-gray-700">
                  {match.status === 'matched' ? '매칭 완료' : '경기 취소됨'}
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
                creatorId={match.creator_id}
                matchTitle={match.title}
              />
            )}
          </div>

          {/* 개설자 신청 관리 패널 */}
          {isCreator && match.status === 'open' && (
            <ParticipantApprovalPanel
              matchId={match.id}
              matchMode={match.match_mode}
              participants={nonCreatorParticipants}
              deptHost={match.dept_host}
              deptGuest={match.dept_guest}
              matchTitle={match.title}
            />
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

function ParticipantRow({ participant, matchId, isCreator, currentUserId }: {
  participant: any
  matchId: string
  isCreator: boolean
  currentUserId?: string
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-white/40 last:border-0">
      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm border shrink-0">
        {participant.user?.name?.[0] ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900 truncate">{participant.user?.name}</span>
          <span className={`badge text-xs shrink-0 ${getStatusColor(participant.status)}`}>
            {getStatusLabel(participant.status)}
          </span>
        </div>
        {participant.intro && (
          <div className="text-xs text-gray-500 italic truncate">💬 {participant.intro}</div>
        )}
      </div>
      {participant.user?.id && participant.user.id !== currentUserId && (
        <a
          href={`/sports/${matchId}/chat/${participant.user.id}`}
          className="shrink-0 text-gray-400 hover:text-primary-600 transition-colors"
          title="채팅"
        >
          <MessageCircle size={14} />
        </a>
      )}
    </div>
  )
}
