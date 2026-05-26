import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Calendar, Users, ExternalLink, Trophy } from 'lucide-react'
import { formatDate, getDaysLeft, getStatusColor, getStatusLabel } from '@/lib/utils'
import ContestApplyButton from '@/components/contests/ContestApplyButton'

export default async function ContestDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: contest } = await supabase
    .from('contests')
    .select(`
      *,
      contest_applications(
        id, user_id, role_tag, status, team_id, applied_at,
        user:users(id, name, department)
      )
    `)
    .eq('id', params.id)
    .single()

  if (!contest) notFound()

  const daysLeft = getDaysLeft(contest.deadline)
  const isExpired = daysLeft < 0
  const myApp = contest.contest_applications?.find((a: any) => a.user_id === user?.id)

  // Group by team_id
  const teams: Record<string, any[]> = {}
  const waitingApps: any[] = []
  contest.contest_applications?.forEach((app: any) => {
    if (app.team_id) {
      if (!teams[app.team_id]) teams[app.team_id] = []
      teams[app.team_id].push(app)
    } else {
      waitingApps.push(app)
    }
  })

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/contests" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} /> 공모전 목록으로
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="card p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                <Trophy size={28} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{contest.title}</h1>
                <p className="text-gray-500 text-sm mt-1">{contest.organizer}</p>
              </div>
              <span className="badge bg-amber-100 text-amber-700 text-sm shrink-0">{contest.category}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-5">
              <div>
                <div className="text-xs text-gray-400">접수 마감</div>
                <div className="font-medium text-gray-900">{formatDate(contest.deadline)}
                  <span className={`ml-2 badge text-xs ${
                    daysLeft <= 3 ? 'bg-red-100 text-red-700' :
                    daysLeft <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>{isExpired ? '마감' : `D-${daysLeft}`}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">팀 구성</div>
                <div className="font-medium text-gray-900">{contest.team_min} ~ {contest.team_max}명</div>
              </div>
              {contest.prize && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-400">시상 내역</div>
                  <div className="font-medium text-gray-900">🏆 {contest.prize}</div>
                </div>
              )}
            </div>

            {/* Roles needed */}
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-2">필요 역할</div>
              <div className="flex flex-wrap gap-2">
                {contest.required_roles?.map((role: string) => (
                  <span key={role} className="badge bg-primary-100 text-primary-700">{role}</span>
                ))}
              </div>
            </div>

            {/* Description */}
            {contest.description && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-2">공모전 소개</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{contest.description}</p>
              </div>
            )}

            {contest.external_url && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <a href={contest.external_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline">
                  <ExternalLink size={14} />
                  공모전 공식 페이지
                </a>
              </div>
            )}
          </div>

          {/* Matched teams */}
          {Object.entries(teams).length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">
                매칭된 팀 ({Object.entries(teams).length}팀)
              </h3>
              <div className="space-y-4">
                {Object.entries(teams).map(([teamId, members]) => (
                  <div key={teamId} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="badge bg-green-100 text-green-700">매칭 완료</span>
                      <span className="text-xs text-gray-500">{members.length}명</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {members.map((member: any) => (
                        <div key={member.id} className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-600 border shadow-sm">
                            {member.user?.name?.[0] ?? '?'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{member.user?.name}</div>
                            <div className="text-xs text-gray-500">{member.role_tag}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waiting applicants */}
          {waitingApps.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">
                매칭 대기 중 ({waitingApps.length}명)
              </h3>
              <div className="space-y-2">
                {waitingApps.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                        {app.user?.name?.[0] ?? '?'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{app.user?.name}</div>
                        <div className="text-xs text-gray-500">{app.user?.department}</div>
                      </div>
                    </div>
                    <span className="badge bg-blue-100 text-blue-700">{app.role_tag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Apply */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">팀 합류 신청</h3>

            {myApp ? (
              <div className="text-center py-2">
                <div className="text-3xl mb-2">{myApp.status === 'matched' ? '🎉' : '⏳'}</div>
                <p className="font-semibold text-gray-900 text-sm">
                  {myApp.status === 'matched' ? '팀 매칭 완료!' : '매칭 대기 중'}
                </p>
                <p className="text-xs text-gray-500 mt-1">역할: {myApp.role_tag}</p>
                {myApp.status === 'matched' && (
                  <p className="text-xs text-green-600 mt-2">
                    팀원 연락처가 알림을 통해 공유되었습니다.
                  </p>
                )}
              </div>
            ) : isExpired ? (
              <p className="text-center text-sm text-gray-500 py-4">마감된 공모전입니다</p>
            ) : (
              <ContestApplyButton
                contestId={contest.id}
                requiredRoles={contest.required_roles ?? []}
                teamMin={contest.team_min}
                teamMax={contest.team_max}
                userId={user?.id}
              />
            )}
          </div>

          {/* Stats */}
          <div className="card p-4 text-sm space-y-2 text-gray-600">
            <div className="flex justify-between">
              <span>총 신청자</span>
              <span className="font-semibold text-gray-900">{contest.contest_applications?.length ?? 0}명</span>
            </div>
            <div className="flex justify-between">
              <span>매칭 완료</span>
              <span className="font-semibold text-green-600">
                {contest.contest_applications?.filter((a: any) => a.status === 'matched').length ?? 0}명
              </span>
            </div>
            <div className="flex justify-between">
              <span>대기 중</span>
              <span className="font-semibold text-blue-600">{waitingApps.length}명</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
