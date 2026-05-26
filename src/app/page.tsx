import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Dumbbell, Trophy, BookOpen, ArrowRight, Users, Calendar } from 'lucide-react'
import { formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: sportCount },
    { count: contestCount },
    { count: studyCount },
    { data: recentSports },
    { data: recentStudies },
    { data: recentContests },
  ] = await Promise.all([
    supabase.from('sport_matches').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('contests').select('*', { count: 'exact', head: true }).gte('deadline', new Date().toISOString().split('T')[0]),
    supabase.from('studies').select('*', { count: 'exact', head: true }).eq('status', 'recruiting'),
    supabase.from('sport_matches').select('*, creator:users(name, department)').eq('status', 'open').order('created_at', { ascending: false }).limit(3),
    supabase.from('studies').select('*, creator:users(name, department)').eq('status', 'recruiting').order('created_at', { ascending: false }).limit(3),
    supabase.from('contests').select('*').gte('deadline', new Date().toISOString().split('T')[0]).order('deadline', { ascending: true }).limit(3),
  ])

  const stats = [
    { label: '모집 중인 스포츠 경기', value: sportCount ?? 0, icon: Dumbbell, color: 'text-blue-600 bg-blue-50', href: '/sports' },
    { label: '진행 중인 공모전', value: contestCount ?? 0, icon: Trophy, color: 'text-amber-600 bg-amber-50', href: '/contests' },
    { label: '모집 중인 스터디', value: studyCount ?? 0, icon: BookOpen, color: 'text-green-600 bg-green-50', href: '/studies' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          대학 생활을 더 풍요롭게,{' '}
          <span className="text-primary-600">UniMatch</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          스포츠 경기 매칭부터 공모전 팀 빌딩, 스터디 그룹까지.<br />
          원하는 활동을 찾아 바로 참여하세요.
        </p>
        {!user && (
          <div className="flex justify-center gap-4 mt-6">
            <Link href="/auth/signup" className="btn-primary px-6 py-2.5">
              시작하기
            </Link>
            <Link href="/auth/login" className="btn-secondary px-6 py-2.5">
              로그인
            </Link>
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={href} href={href}
            className="card p-6 flex items-center gap-4 hover:border-primary-200 hover:shadow-md transition-all group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={24} />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
            <ArrowRight size={16} className="ml-auto text-gray-300 group-hover:text-primary-500 transition-colors" />
          </Link>
        ))}
      </section>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Sports */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Dumbbell size={18} className="text-blue-600" /> 최근 스포츠 경기
            </h2>
            <Link href="/sports" className="text-sm text-primary-600 hover:underline">전체 보기</Link>
          </div>
          <div className="space-y-3">
            {recentSports?.length ? recentSports.map((m: any) => (
              <Link key={m.id} href={`/sports/${m.id}`}
                className="card p-4 block hover:border-primary-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-gray-900 text-sm">{m.sport_type}</span>
                  <span className={`badge ${getStatusColor(m.status)}`}>{getStatusLabel(m.status)}</span>
                </div>
                {m.match_mode === 'department'
                  ? <p className="text-xs text-gray-500">{m.dept_host} vs {m.dept_guest ?? '모집 중'}</p>
                  : <p className="text-xs text-gray-500">개인 매칭 · {m.creator?.name}</p>
                }
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <Calendar size={12} />
                  {formatDateTime(m.scheduled_at)}
                </div>
              </Link>
            )) : (
              <div className="card p-6 text-center text-gray-400 text-sm">
                모집 중인 경기가 없습니다
              </div>
            )}
          </div>
        </section>

        {/* Recent Contests */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Trophy size={18} className="text-amber-600" /> 마감 임박 공모전
            </h2>
            <Link href="/contests" className="text-sm text-primary-600 hover:underline">전체 보기</Link>
          </div>
          <div className="space-y-3">
            {recentContests?.length ? recentContests.map((c: any) => {
              const daysLeft = Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000)
              return (
                <Link key={c.id} href={`/contests/${c.id}`}
                  className="card p-4 block hover:border-primary-200 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-sm line-clamp-1">{c.title}</span>
                    <span className={`badge ml-2 shrink-0 ${daysLeft <= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      D-{daysLeft}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{c.organizer}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.required_roles?.slice(0, 3).map((r: string) => (
                      <span key={r} className="badge bg-gray-100 text-gray-600">{r}</span>
                    ))}
                  </div>
                </Link>
              )
            }) : (
              <div className="card p-6 text-center text-gray-400 text-sm">
                진행 중인 공모전이 없습니다
              </div>
            )}
          </div>
        </section>

        {/* Recent Studies */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen size={18} className="text-green-600" /> 최근 스터디 모집
            </h2>
            <Link href="/studies" className="text-sm text-primary-600 hover:underline">전체 보기</Link>
          </div>
          <div className="space-y-3">
            {recentStudies?.length ? recentStudies.map((s: any) => (
              <Link key={s.id} href={`/studies/${s.id}`}
                className="card p-4 block hover:border-primary-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-1">
                  <span className="font-semibold text-gray-900 text-sm line-clamp-1">{s.title}</span>
                  <span className={`badge ${getStatusColor(s.status)}`}>{getStatusLabel(s.status)}</span>
                </div>
                <p className="text-xs text-gray-500">{s.creator?.name} · {s.creator?.department}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <Users size={12} />
                  {s.min_members}~{s.max_members}명
                </div>
              </Link>
            )) : (
              <div className="card p-6 text-center text-gray-400 text-sm">
                모집 중인 스터디가 없습니다
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
