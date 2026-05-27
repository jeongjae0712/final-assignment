import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Dumbbell, Trophy, BookOpen, Plus, Calendar, Users, Pencil } from 'lucide-react'
import { formatDate, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils'
import DeleteMatchButton from '@/components/sports/DeleteMatchButton'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users').select('*').eq('id', user.id).single()

  const [
    { data: mySportParticipations },
    { data: myContestApps },
    { data: myStudyApps },
    { data: myCreatedSports },
    { data: myCreatedStudies },
  ] = await Promise.all([
    supabase.from('sport_participants')
      .select('*, match:sport_matches(id, title, sport_type, match_mode, dept_host, dept_guest, scheduled_at, status, creator_id)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
      .limit(10),
    supabase.from('contest_applications')
      .select('*, contest:contests(id, title, organizer, deadline, category)')
      .eq('user_id', user.id)
      .order('applied_at', { ascending: false })
      .limit(10),
    supabase.from('study_applications')
      .select('*, study:studies(id, title, status, creator_id, min_members, max_members, recruit_deadline)')
      .eq('user_id', user.id)
      .order('applied_at', { ascending: false })
      .limit(10),
    supabase.from('sport_matches')
      .select('*, sport_participants(id, status)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('studies')
      .select('*, study_applications(id, status)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Profile */}
      <div className="card p-6 mb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-700">
            {profile?.name?.[0] ?? user.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile?.name}</h1>
            <p className="text-gray-500">{profile?.department} · {profile?.student_number ?? '학번 미등록'}</p>
            <p className="text-sm text-gray-400">@{profile?.username}</p>
          </div>
          <div className="ml-auto">
            <Link href="/mypage/edit" className="btn-secondary text-sm">프로필 수정</Link>
          </div>
        </div>
        {profile?.interest_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
            {profile.interest_tags.map((tag: string) => (
              <span key={tag} className="badge bg-primary-100 text-primary-700">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── 스포츠 ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Dumbbell size={18} className="text-blue-600" /> 스포츠 활동
            </h2>
            <Link href="/sports/new" className="btn-secondary text-xs px-2.5 py-1.5">
              <Plus size={14} /> 경기 개설
            </Link>
          </div>

          {/* 내가 개설한 경기 */}
          {myCreatedSports && myCreatedSports.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">내가 개설한 경기</p>
              <div className="space-y-2">
                {myCreatedSports.map((m: any) => {
                  const totalCount = m.sport_participants?.length ?? 0
                  const pendingCount = m.sport_participants?.filter((p: any) => p.status === 'pending').length ?? 0
                  return (
                    <div key={m.id} className="card p-3 hover:border-blue-200 transition-all">
                      {/* 제목 & 상태 */}
                      <div className="flex items-start gap-2 mb-2">
                        <Link href={`/sports/${m.id}`} className="flex-1 min-w-0 group">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 truncate">
                              {m.title}
                            </span>
                            <span className={`badge text-xs shrink-0 ${getStatusColor(m.status)}`}>
                              {getStatusLabel(m.status)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {m.sport_type} · {formatDateTime(m.scheduled_at)}
                          </p>
                        </Link>
                      </div>

                      {/* 참여 현황 */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Users size={11} /> 참여 {totalCount}명
                        </span>
                        {pendingCount > 0 && (
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                            대기 {pendingCount}건
                          </span>
                        )}
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                        <Link href={`/sports/${m.id}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-lg transition-colors">
                          <Users size={13} />
                          신청 관리
                        </Link>
                        <Link href={`/sports/${m.id}/edit`}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-100 rounded-lg transition-colors">
                          <Pencil size={13} />
                          수정
                        </Link>
                        <DeleteMatchButton matchId={m.id} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 참여 신청한 경기 */}
          <div>
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">참여 신청한 경기</p>
            {mySportParticipations?.filter((p: any) => p.match && p.match.creator_id !== user.id).length ? (
              <div className="space-y-2">
                {mySportParticipations
                  ?.filter((p: any) => p.match && p.match.creator_id !== user.id)
                  .map((p: any) => (
                    <Link key={p.id} href={`/sports/${p.match.id}`}
                      className="card p-3 flex items-center gap-3 hover:border-blue-200 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {p.match.title ?? p.match.sport_type}
                          </span>
                          <span className={`badge text-xs shrink-0 ${getStatusColor(p.status)}`}>
                            {getStatusLabel(p.status)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.match.sport_type} · {formatDateTime(p.match.scheduled_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="card p-4 text-center text-gray-400 text-sm">참여한 경기가 없습니다</div>
            )}
          </div>
        </section>

        {/* ── 공모전 ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trophy size={18} className="text-amber-600" /> 공모전 신청
          </h2>
          {myContestApps?.length ? (
            <div className="space-y-2">
              {myContestApps.map((app: any) => (
                <Link key={app.id} href={`/contests/${app.contest_id}`}
                  className="card p-3 block hover:border-amber-200 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 line-clamp-1">{app.contest?.title}</span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        역할: {app.role_tag} · 마감 {formatDate(app.contest?.deadline)}
                      </p>
                    </div>
                    <span className={`badge text-xs shrink-0 ${
                      app.status === 'matched' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {app.status === 'matched' ? '팀 매칭 완료' : '대기 중'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-4 text-center text-gray-400 text-sm">신청한 공모전이 없습니다</div>
          )}
          <Link href="/contests" className="btn-secondary w-full justify-center text-sm">
            공모전 탐색하기
          </Link>
        </section>

        {/* ── 스터디 ── */}
        <section className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen size={18} className="text-green-600" /> 스터디
            </h2>
            <Link href="/studies/new" className="btn-secondary text-xs px-2.5 py-1.5">
              <Plus size={14} /> 스터디 개설
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myCreatedStudies?.map((s: any) => {
              const acceptedCount = s.study_applications?.filter((a: any) => a.status === 'accepted').length ?? 0
              const pendingCount = s.study_applications?.filter((a: any) => a.status === 'pending').length ?? 0
              return (
                <Link key={s.id} href={`/studies/${s.id}`}
                  className="card p-4 block hover:border-green-200 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-900 line-clamp-1">{s.title}</span>
                    <span className={`badge text-xs shrink-0 ${getStatusColor(s.status)}`}>
                      {getStatusLabel(s.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Users size={11} /> {acceptedCount}/{s.max_members}명</span>
                    {pendingCount > 0 && (
                      <span className="text-amber-600 font-medium">대기 {pendingCount}건</span>
                    )}
                    <span className="badge bg-primary-100 text-primary-600">개설자</span>
                  </div>
                </Link>
              )
            })}

            {myStudyApps?.filter((a: any) => a.study?.creator_id !== user.id).map((app: any) => (
              <Link key={app.id} href={`/studies/${app.study_id}`}
                className="card p-4 block hover:border-green-200 transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900 line-clamp-1">{app.study?.title}</span>
                  <span className={`badge text-xs shrink-0 ${getStatusColor(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar size={11} />
                  모집 마감 {formatDate(app.study?.recruit_deadline)}
                </div>
              </Link>
            ))}

            {(!myCreatedStudies?.length && !myStudyApps?.length) && (
              <div className="card p-4 text-center text-gray-400 text-sm col-span-2">참여한 스터디가 없습니다</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
