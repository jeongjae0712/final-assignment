import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, MapPin, Calendar, Users } from 'lucide-react'
import { SPORT_TYPES, formatDateTime } from '@/lib/utils'

interface PageProps {
  searchParams: Promise<{ sport?: string; mode?: string }>
}

export default async function SportsPage({ searchParams }: PageProps) {
  const { sport, mode } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('sport_matches')
    .select('*, creator:users(name, department), sport_participants(id, team_side, status, user_id)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (sport) query = query.eq('sport_type', sport)
  if (mode) query = query.eq('match_mode', mode)

  const { data: matches } = await query

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">스포츠 경기 매칭</h1>
          <p className="text-gray-500 mt-1">경기를 개설하거나 원하는 경기에 참여하세요</p>
        </div>
        <Link href="/sports/new" className="btn-primary">
          <Plus size={18} /> 경기 개설
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <FilterLink href="/sports" active={!sport && !mode} label="전체" />
        <span className="text-gray-300 self-center">|</span>
        {SPORT_TYPES.map(s => (
          <FilterLink key={s} href={`/sports?sport=${s}`} active={sport === s} label={s} />
        ))}
        <span className="text-gray-300 self-center">|</span>
        <FilterLink href="/sports?mode=department" active={mode === 'department'} label="학과 대항전" />
        <FilterLink href="/sports?mode=individual" active={mode === 'individual'} label="개인 매칭" />
      </div>

      {matches?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {matches.map((match: any) => {
            const hostCount = match.sport_participants?.filter((p: any) => p.team_side === 'host').length ?? 0
            const guestCount = match.sport_participants?.filter((p: any) => p.team_side === 'guest').length ?? 0
            const totalCount = match.sport_participants?.filter((p: any) => p.team_side === 'individual').length ?? 0
            const isMyMatch = match.sport_participants?.some((p: any) => p.user_id === user?.id)

            return (
              <Link key={match.id} href={`/sports/${match.id}`}
                className="card p-5 block hover:border-primary-200 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-primary-700">{match.title}</h3>
                  {isMyMatch && <span className="badge bg-primary-100 text-primary-700 text-xs shrink-0 ml-2">참여 중</span>}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="badge bg-gray-100 text-gray-600 text-xs">{match.sport_type}</span>
                  <span className={`badge text-xs ${match.match_mode === 'department' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {match.match_mode === 'department' ? '학과 대항전' : '개인 매칭'}
                  </span>
                </div>

                {match.match_mode === 'department' && (
                  <p className="text-sm text-gray-700 font-medium mb-2">
                    {match.dept_host} <span className="text-gray-400">vs</span>{' '}
                    {match.dept_guest ?? <span className="text-amber-600">상대 모집 중</span>}
                  </p>
                )}

                <div className="space-y-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5"><Calendar size={13} />{formatDateTime(match.scheduled_at)}</div>
                  <div className="flex items-center gap-1.5"><MapPin size={13} />{match.location}</div>
                  <div className="flex items-center gap-1.5">
                    <Users size={13} />
                    {match.match_mode === 'department'
                      ? `주최 ${hostCount}명 · 상대 ${guestCount}명 참여 중`
                      : `${totalCount} / ${match.min_players}~${match.max_players}명`}
                  </div>
                </div>

                {/* 개인 매칭만 진행률 바 표시 */}
                {match.match_mode === 'individual' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>참여 인원</span>
                      <span>{totalCount} / {match.max_players}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${Math.min((totalCount / match.max_players) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 학과 대항전: 팀 참여 상태 뱃지 */}
                {match.match_mode === 'department' && (
                  <div className="mt-3 flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${hostCount > 0 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                      🔵 {match.dept_host} {hostCount > 0 ? `${hostCount}명` : '미참여'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${guestCount > 0 ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                      🟣 {match.dept_guest ?? '상대팀'} {guestCount > 0 ? `${guestCount}명` : '미참여'}
                    </span>
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-400 text-right">신청 마감 {formatDateTime(match.deadline)}</div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-3">🏃</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">모집 중인 경기가 없습니다</h3>
          <p className="text-gray-400 text-sm mb-4">첫 번째로 경기를 개설해 보세요!</p>
          <Link href="/sports/new" className="btn-primary justify-center"><Plus size={16} /> 경기 개설</Link>
        </div>
      )}
    </div>
  )
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link href={href} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${active ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400 hover:text-primary-600'}`}>
      {label}
    </Link>
  )
}