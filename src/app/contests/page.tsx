import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Calendar, Users, ExternalLink } from 'lucide-react'
import { CONTEST_CATEGORIES, formatDate, getDaysLeft } from '@/lib/utils'

interface PageProps {
  searchParams: { category?: string; deadline?: string }
}

export default async function ContestsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('contests')
    .select(`*, contest_applications(user_id, status, team_id)`)
    .gte('deadline', today)
    .order('deadline', { ascending: true })

  if (searchParams.category) query = query.eq('category', searchParams.category)
  if (searchParams.deadline === 'week') {
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    query = query.lte('deadline', nextWeek)
  }

  const { data: contests } = await query

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">공모전</h1>
        <p className="text-gray-500 mt-1">관심 있는 공모전을 찾아 팀원을 모집하세요</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/contests"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !searchParams.category && !searchParams.deadline
              ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
          }`}>전체</Link>

        {CONTEST_CATEGORIES.map(cat => (
          <Link key={cat} href={`/contests?category=${cat}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              searchParams.category === cat
                ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
            }`}>{cat}</Link>
        ))}

        <span className="text-gray-300 self-center">|</span>
        <Link href="/contests?deadline=week"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            searchParams.deadline === 'week'
              ? 'bg-amber-500 text-white' : 'bg-white text-amber-600 border border-amber-300 hover:border-amber-400'
          }`}>마감 1주일 이내</Link>
      </div>

      {/* Grid */}
      {contests?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contests.map((contest: any) => {
            const daysLeft = getDaysLeft(contest.deadline)
            const myApp = contest.contest_applications?.find(
              (a: any) => a.user_id === user?.id
            )
            const applicantCount = contest.contest_applications?.length ?? 0
            const matchedCount = contest.contest_applications?.filter((a: any) => a.status === 'matched').length ?? 0

            return (
              <Link key={contest.id} href={`/contests/${contest.id}`}
                className="card p-5 block hover:border-primary-200 hover:shadow-md transition-all group">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    <Trophy size={20} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
                      {contest.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{contest.organizer}</p>
                  </div>
                </div>

                {/* Category */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="badge bg-amber-100 text-amber-700">{contest.category}</span>
                  {myApp && (
                    <span className={`badge ${myApp.status === 'matched' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {myApp.status === 'matched' ? '팀 매칭 완료' : '신청 중'}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>마감 {formatDate(contest.deadline)}</span>
                    <span className={`ml-auto badge text-xs ${
                      daysLeft <= 3 ? 'bg-red-100 text-red-700' :
                      daysLeft <= 7 ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>D-{daysLeft}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={13} />
                    <span>{contest.team_min}~{contest.team_max}명 · 신청 {applicantCount}명</span>
                    {matchedCount > 0 && <span className="text-green-600 text-xs">({matchedCount}명 매칭)</span>}
                  </div>
                </div>

                {/* Roles */}
                <div className="flex flex-wrap gap-1">
                  {contest.required_roles?.slice(0, 4).map((r: string) => (
                    <span key={r} className="badge bg-gray-100 text-gray-600 text-xs">{r}</span>
                  ))}
                  {(contest.required_roles?.length ?? 0) > 4 && (
                    <span className="badge bg-gray-100 text-gray-500 text-xs">+{contest.required_roles.length - 4}</span>
                  )}
                </div>

                {/* Prize */}
                {contest.prize && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 truncate">
                    🏆 {contest.prize}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">공모전 없음</h3>
          <p className="text-gray-400 text-sm">
            {searchParams.category ? '해당 분야의 공모전이 없습니다.' : '현재 모집 중인 공모전이 없습니다.'}
          </p>
        </div>
      )}
    </div>
  )
}
