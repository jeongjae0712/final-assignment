import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Users, Calendar, Trophy } from 'lucide-react'
import { CONTEST_CATEGORIES, formatDate, getDaysLeft } from '@/lib/utils'

interface PageProps {
  searchParams: { category?: string }
}

export default async function ContestsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('contests')
    .select('*, creator:users(name, department), contest_applications(id, user_id, status)')
    .eq('status', 'recruiting')
    .order('created_at', { ascending: false })

  if (searchParams.category) query = query.eq('category', searchParams.category)

  const { data: contests } = await query

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">공모전 팀원 모집</h1>
          <p className="text-gray-500 mt-1">공모전에 함께 참여할 팀원을 모집하거나, 팀에 합류하세요</p>
        </div>
        <Link href="/contests/new" className="btn-primary">
          <Plus size={18} /> 팀원 모집
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/contests"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !searchParams.category ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
          }`}>전체</Link>
        {CONTEST_CATEGORIES.map(cat => (
          <Link key={cat} href={`/contests?category=${cat}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              searchParams.category === cat ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
            }`}>{cat}</Link>
        ))}
      </div>

      {contests?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contests.map((contest: any) => {
            const appliedCount = contest.contest_applications?.length ?? 0
            const myApp = contest.contest_applications?.find((a: any) => a.user_id === user?.id)
            const daysLeft = getDaysLeft(contest.deadline)
            const isCreator = contest.creator_id === user?.id

            return (
              <Link key={contest.id} href={`/contests/${contest.id}`}
                className="card p-5 block hover:border-primary-200 hover:shadow-md transition-all group">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    <Trophy size={20} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-primary-700">
                      {contest.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{contest.creator?.name} · {contest.creator?.department}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="badge bg-amber-100 text-amber-700">{contest.category}</span>
                  {isCreator && <span className="badge bg-primary-100 text-primary-700">개설자</span>}
                  {myApp && <span className="badge bg-blue-100 text-blue-700">신청 중</span>}
                </div>

                <div className="space-y-1.5 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Users size={13} />
                    <span>{appliedCount} / {contest.team_max}명 모집 중</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-1">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min((appliedCount / contest.team_max) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>모집 마감 {formatDate(contest.deadline)}</span>
                    {daysLeft > 0 && daysLeft <= 7 && (
                      <span className="badge text-xs bg-red-100 text-red-700">D-{daysLeft}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {contest.required_roles?.slice(0, 4).map((r: string) => (
                    <span key={r} className="badge bg-gray-100 text-gray-600 text-xs">{r}</span>
                  ))}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">모집 중인 팀이 없습니다</h3>
          <p className="text-gray-400 text-sm mb-4">
            {searchParams.category ? '해당 분야의 팀 모집이 없습니다.' : '공모전 팀원을 먼저 모집해보세요!'}
          </p>
          <Link href="/contests/new" className="btn-primary justify-center">
            <Plus size={16} /> 팀원 모집하기
          </Link>
        </div>
      )}
    </div>
  )
}