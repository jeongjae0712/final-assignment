import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, MapPin, Calendar, Users } from 'lucide-react'
import { SPORT_TYPES, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils'

interface PageProps {
  searchParams: { sport?: string; status?: string; mode?: string }
}

export default async function SportsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('sport_matches')
    .select(`
      *,
      creator:users(name, department),
      sport_participants(id, team_side, status, user_id)
    `)
    .order('created_at', { ascending: false })

  if (searchParams.sport) query = query.eq('sport_type', searchParams.sport)
  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.mode) query = query.eq('match_mode', searchParams.mode)

  const { data: matches } = await query

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">스포츠 경기 매칭</h1>
          <p className="text-gray-500 mt-1">경기를 개설하거나 원하는 경기에 참여하세요</p>
        </div>
        <Link href="/sports/new" className="btn-primary">
          <Plus size={18} /> 경기 개설
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterLink href="/sports" active={!searchParams.sport && !searchParams.status && !searchParams.mode} label="전체" />
        <span className="text-gray-300 self-center">|</span>
        {SPORT_TYPES.map(sport => (
          <FilterLink
            key={sport}
            href={`/sports?sport=${sport}`}
            active={searchParams.sport === sport}
            label={sport}
          />
        ))}
        <span className="text-gray-300 self-center">|</span>
        <FilterLink href="/sports?status=open" active={searchParams.status === 'open'} label="모집 중" />
        <FilterLink href="/sports?status=matched" active={searchParams.status === 'matched'} label="매칭 완료" />
        <span className="text-gray-300 self-center">|</span>
        <FilterLink href="/sports?mode=department" active={searchParams.mode === 'department'} label="학과 대항전" />
        <FilterLink href="/sports?mode=individual" active={searchParams.mode === 'individual'} label="개인 매칭" />
      </div>

      {/* Grid */}
      {matches?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {matches.map((match: any) => {
            const hostCount = match.sport_participants?.filter((p: any) => p.team_side === 'host' && p.status !== 'waitlisted').length ?? 0
            const guestCount = match.sport_participants?.filter((p: any) => p.team_side === 'guest' && p.status !== 'waitlisted').length ?? 0
            const totalCount = match.sport_participants?.filter((p: any) => p.team_side === 'individual' && p.status !== 'waitlisted').length ?? 0
            const isMyMatch = match.sport_participants?.some((p: any) => p.user_id === user?.id)

            return (
              <Link key={match.id} href={`/sports/${match.id}`}
                className="card p-5 block hover:border-primary-200 hover:shadow-md transition-all group">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-gray-900">{match.sport_type}</span>
                      <span className={`badge ${match.match_mode === 'department' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {match.match_mode === 'department' ? '학과 대항전' : '개인 매칭'}
                      </span>
                    </div>
                    {match.match_mode === 'department' ? (
                      <p className="text-sm text-gray-700 font-medium">
                        {match.dept_host} <span className="text-gray-400">vs</span> {match.dept_guest ?? <span className="text-amber-600">상대 모집 중</span>}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">개인 참여 · {match.creator?.name}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`badge ${getStatusColor(match.status)}`}>
                      {getStatusLabel(match.status)}
                    </span>
                    {isMyMatch && (
                      <span className="badge bg-primary-100 text-primary-700">참여 중</span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {formatDateTime(match.scheduled_at)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    {match.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={14} />
                    {match.match_mode === 'department'
                      ? `주최 ${hostCount}/${match.min_players}명 · 상대 ${guestCount}/${match.min_players}명`
                      : `${totalCount}/${match.min_players}~${match.max_players}명`
                    }
                  </div>
                </div>

                {/* Progress bars for department mode */}
                {match.match_mode === 'department' && (
                  <div className="mt-3 space-y-1">
                    <ProgressBar label={match.dept_host} count={hostCount} max={match.min_players} color="bg-blue-500" />
                    <ProgressBar label={match.dept_guest ?? '상대팀'} count={guestCount} max={match.min_players} color="bg-purple-500" />
                  </div>
                )}

                {/* Individual progress */}
                {match.match_mode === 'individual' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>참여 인원</span>
                      <span>{totalCount} / {match.max_players}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${Math.min((totalCount / match.max_players) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-400 text-right group-hover:text-primary-500 transition-colors">
                  신청 마감 {formatDateTime(match.deadline)}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-3">🏃</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">경기 없음</h3>
          <p className="text-gray-400 text-sm mb-4">
            {searchParams.sport || searchParams.status || searchParams.mode
              ? '해당 조건의 경기가 없습니다.'
              : '아직 등록된 경기가 없습니다. 첫 번째로 경기를 개설해 보세요!'}
          </p>
          <Link href="/sports/new" className="btn-primary justify-center">
            <Plus size={16} /> 경기 개설
          </Link>
        </div>
      )}
    </div>
  )
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link href={href}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400 hover:text-primary-600'
      }`}>
      {label}
    </Link>
  )
}

function ProgressBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = Math.min((count / Math.max(max, 1)) * 100, 100)
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-0.5">
        <span className="truncate max-w-[100px]">{label}</span>
        <span>{count}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
