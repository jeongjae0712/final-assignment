import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, MapPin, Calendar, Users, Clock, MessageCircle, Crown, Edit2, Trash2 } from 'lucide-react'
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

  // 媛쒖꽕?먮뒗 李몄뿬??紐⑸줉?먯꽌 ?쒖쇅
  const allParticipants = (match.sport_participants ?? []) as any[]
  const nonCreatorParticipants = allParticipants.filter((p: any) => p.user?.id !== match.creator_id)

  const myParticipation = !isCreator
    ? nonCreatorParticipants.find((p: any) => p.user?.id === user?.id)
    : null

  const hostParticipants = nonCreatorParticipants.filter((p: any) => p.team_side === 'host')
  const guestParticipants = nonCreatorParticipants.filter((p: any) => p.team_side === 'guest')
  const individualParticipants = nonCreatorParticipants.filter((p: any) => p.team_side === 'individual')
  const isPast = new Date(match.deadline) < new Date()

  // 寃뚯뒪???숆낵蹂?洹몃９??  const guestByDept: Record<string, any[]> = {}
  for (const p of guestParticipants as any[]) {
    const dept = (p as any).user?.department ?? '알 수 없음'
    if (!guestByDept[dept]) guestByDept[dept] = []
    guestByDept[dept].push(p)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/sports" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} /> 寃쎄린 紐⑸줉?쇰줈
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 硫붿씤 ?뺣낫 */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{match.title}</h1>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-gray-100 text-gray-700">{match.sport_type}</span>
                  <span className={`badge ${match.match_mode === 'department' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {match.match_mode === 'department' ? '?숆낵 ???쟾' : '媛쒖씤 留ㅼ묶'}
                  </span>
                </div>
                {match.match_mode === 'department' && (
                  <p className="text-lg text-gray-700 font-medium">
                    {match.dept_host}
                    <span className="text-gray-400 mx-2">vs</span>
                    {match.dept_guest
                      ? <span className="text-gray-700">{match.dept_guest}</span>
                      : <span className="text-amber-600 text-base">?곷?? 誘몄젙</span>
                    }
                  </p>
                )}
              </div>
              <span className={`badge text-sm px-3 py-1 ${getStatusColor(match.status)}`}>
                {getStatusLabel(match.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow icon={Calendar} label="寃쎄린 ?쇱떆" value={formatDateTime(match.scheduled_at)} />
              <InfoRow icon={MapPin} label="?μ냼" value={match.location} />
              <InfoRow icon={Clock} label="?좎껌 留덇컧" value={formatDateTime(match.deadline)} />
              <InfoRow icon={Users} label="媛쒖꽕?? value={`${match.creator?.name} (${match.creator?.department})`} />
            </div>

            {match.match_mode === 'department' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  沅뚯옣 李몄뿬 ?몄썝: <span className="font-medium text-gray-700">{match.min_players}~{match.max_players}紐?/span>
                  <span className="ml-1 text-gray-400">(李멸퀬??</span>
                </p>
              </div>
            )}

            {match.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-2">寃쎄린 ?ㅻ챸</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{match.description}</p>
              </div>
            )}
          </div>

          {/* 李몄뿬???꾪솴 */}
          {match.match_mode === 'department' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ?덊? */}
              <div className="card p-5 bg-blue-50 border-blue-100 text-blue-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">?뵷 {match.dept_host ?? '?덊?'}</h3>
                  <span className="text-2xl font-bold text-blue-600">
                    {hostParticipants.length}<span className="text-xs font-normal ml-0.5">紐?/span>
                  </span>
                </div>
                <p className="text-xs opacity-50 mb-3">沅뚯옣 {match.min_players}~{match.max_players}紐?/p>
                <div className="space-y-2">
                  {hostParticipants.map((p: any) => (
                    <ParticipantRow key={p.id} participant={p} matchId={match.id} isCreator={isCreator} currentUserId={user?.id} />
                  ))}
                  {hostParticipants.length === 0 && (
                    <p className="text-xs text-center py-2 opacity-60">?꾩쭅 李몄뿬?먭? ?놁뒿?덈떎</p>
                  )}
                </div>
              </div>

              {/* ?댁썾?댄? */}
              {match.dept_guest ? (
                <div className="card p-5 bg-purple-50 border-purple-100 text-purple-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">?윢 {match.dept_guest}</h3>
                    <span className="text-2xl font-bold text-purple-600">
                      {guestParticipants.filter((p: any) => p.status === 'confirmed').length}
                      <span className="text-xs font-normal ml-0.5">紐?/span>
                    </span>
                  </div>
                  <p className="text-xs opacity-50 mb-3">沅뚯옣 {match.min_players}~{match.max_players}紐?/p>
                  <div className="space-y-2">
                    {guestParticipants.filter((p: any) => p.status === 'confirmed').map((p: any) => (
                      <ParticipantRow key={p.id} participant={p} matchId={match.id} isCreator={isCreator} currentUserId={user?.id} />
                    ))}
                    {guestParticipants.filter((p: any) => p.status === 'confirmed').length === 0 && (
                      <p className="text-xs text-center py-2 opacity-60">?꾩쭅 李몄뿬?먭? ?놁뒿?덈떎</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card p-5 bg-gray-50 border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-gray-700">?윢 ?곷?? ?좎껌 ?꾪솴</h3>
                    <span className="text-sm font-bold text-amber-600">
                      {Object.keys(guestByDept).length}? ?좎껌
                    </span>
                  </div>
                  {Object.keys(guestByDept).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">?꾩쭅 ?좎껌??????놁뒿?덈떎</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(guestByDept).map(([dept, members]: [string, any[]]) => (
                        <div key={dept} className="bg-white rounded-lg px-3 py-2 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">{dept}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{members.length}紐??좎껌</span>
                              {isCreator && members[0]?.user && (
                                <Link
                                  href={`/sports/${match.id}/chat/${members[0].user.id}`}
                                  className="flex items-center gap-0.5 text-xs text-primary-600 hover:text-primary-700"
                                >
                                  <MessageCircle size={12} /> 梨꾪똿
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">媛쒖꽕?먭? ???吏곸젒 ?좎젙?⑸땲??/p>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">李몄뿬??紐⑸줉</h3>
                <span className="text-sm text-gray-500">{individualParticipants.length} / {match.max_players}紐?/span>
              </div>
              <div className="space-y-2">
                {individualParticipants.map((p: any) => (
                  <ParticipantRow key={p.id} participant={p} matchId={match.id} isCreator={isCreator} currentUserId={user?.id} />
                ))}
                {individualParticipants.length === 0 && (
                  <p className="text-xs text-center text-gray-400 py-3">?꾩쭅 李몄뿬?먭? ?놁뒿?덈떎</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ?ъ씠?쒕컮 */}
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

          {/* ?? ?곹깭 移대뱶 ?? */}
          <div className="card p-5">
            {isCreator ? (
              /* ?? 媛쒖꽕???꾩슜 酉??? */
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                  <Crown size={22} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">?닿? 媛쒖꽕??寃쎄린</p>
                  <p className="text-xs text-gray-500 mt-0.5">二쇱턀?먮줈??寃쎄린瑜?愿由ы빀?덈떎</p>
                </div>
                {match.status === 'open' && (
                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/sports/${match.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 size={14} /> ?섏젙
                    </Link>
                    <DeleteMatchButton
                      matchId={match.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    />
                  </div>
                )}
              </div>
            ) : myParticipation ? (
              /* ?? 李몄뿬??酉??? */
              <div className="text-center space-y-2">
                <div className="text-2xl">
                  {myParticipation.status === 'confirmed' ? '?? :
                   myParticipation.status === 'rejected' ? '?? : '??}
                </div>
                <p className="font-semibold text-gray-900">
                  {myParticipation.status === 'confirmed' ? '李몄뿬 ?뺤젙!' :
                   myParticipation.status === 'rejected' ? '李몄뿬 嫄곗젅?? : '寃???湲?以?}
                </p>
                <span className={`badge inline-block text-sm ${getStatusColor(myParticipation.status)}`}>
                  {getStatusLabel(myParticipation.status)}
                </span>
                {myParticipation.intro && (
                  <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded px-2 py-1.5 text-left">
                    ?뮠 {myParticipation.intro}
                  </p>
                )}
                {/* 媛쒖꽕?먯뿉寃?臾몄쓽 ??媛쒖꽕??蹂몄씤?먭쾶???쒖떆 ????*/}
                <Link
                  href={`/sports/${match.id}/chat/${match.creator_id}`}
                  className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 text-sm text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <MessageCircle size={15} />
                  媛쒖꽕?먯뿉寃?臾몄쓽
                </Link>
                {match.status === 'open' && myParticipation.status !== 'rejected' && (
                  <SportJoinButton matchId={match.id} participantId={myParticipation.id} mode="cancel" />
                )}
              </div>
            ) : match.status !== 'open' ? (
              /* ?? 留덇컧/?꾨즺 ?? */
              <div className="text-center">
                <div className="text-2xl mb-2">{match.status === 'matched' ? '?럦' : '?뵏'}</div>
                <p className="font-semibold text-gray-700">
                  {match.status === 'matched' ? '留ㅼ묶 ?꾨즺' : '寃쎄린 痍⑥냼??}
                </p>
              </div>
            ) : isPast ? (
              /* ?? 留덇컧 ?? */
              <div className="text-center">
                <p className="text-sm text-gray-500">?좎껌 留덇컧??/p>
              </div>
            ) : (
              /* ?? ?좎껌 踰꾪듉 ?? */
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

          {/* 媛쒖꽕???좎껌 愿由??⑤꼸 */}
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
          <div className="text-xs text-gray-500 italic truncate">?뮠 {participant.intro}</div>
        )}
      </div>
      {/* 媛쒖꽕?먥넂李몄뿬??梨꾪똿 / 李몄뿬?먥넂媛쒖꽕??梨꾪똿 (?먭린 ?먯떊? ?쒖쇅) */}
      {participant.user?.id && participant.user.id !== currentUserId && (
        <a
          href={`/sports/${matchId}/chat/${participant.user.id}`}
          className="shrink-0 text-gray-400 hover:text-primary-600 transition-colors"
          title="梨꾪똿"
        >
          <MessageCircle size={14} />
        </a>
      )}
    </div>
  )
}
