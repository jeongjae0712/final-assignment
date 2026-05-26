import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Calendar, Users, Trophy } from 'lucide-react'
import { formatDate, getDaysLeft, getStatusColor, getStatusLabel } from '@/lib/utils'
import ContestApplyButton from '@/components/contests/ContestApplyButton'

export default async function ContestDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: contest } = await supabase
    .from('contests')
    .select(`
      *,
      creator:users(id, name, department),
      contest_applications(
        id, user_id, role_tag, status, applied_at,
        user:users(id, name, department)
      )
    `)
    .eq('id', params.id)
    .single()

  if (!contest) notFound()

  const daysLeft = getDaysLeft(contest.deadline)
  const isExpired = daysLeft < 0
  const isCompleted = contest.status === 'matched'
  const myApp = contest.contest_applications?.find((a: any) => a.user_id === user?.id)
  const isCreator = contest.creator_id === user?.id
  const appliedCount = contest.contest_applications?.length ?? 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/contests" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} /> 공모전 목록으로
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                <Trophy size={28} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{contest.title}</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {contest.creator?.name} · {contest.creator?.department}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="badge bg-amber-100 text-amber-700">{contest.category}</span>
                {isCompleted && <span className="badge bg-green-100 text-green-700">모집 완료</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-5">
              <div>
                <div className="text-xs text-gray-400">팀 구성</div>
                <div className="font-medium text-gray-900">{contest.team_min} ~ {contest.team_max}명</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">모집 마감</div>
                <div className="font-medium text-gray-900">
                  {formatDate(contest.deadline)}
                  {!isExpired && daysLeft <= 7 && (
                    <span className="ml-2 badge text-xs bg-red-100 text-red-700">D-{daysLeft}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-2">필요 역할</div>
              <div className="flex flex-wrap gap-2">
                {contest.required_roles?.map((role: string) => (
                  <span key={role} className="badge bg-primary-100 text-primary-700">{role}</span>
                ))}
              </div>
            </div>

            {contest.description && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-2">모집 내용</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{contest.description}</p>
              </div>
            )}
          </div>

          {/* Team members */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">
              팀원 현황 ({appliedCount}/{contest.team_max}명)
            </h3>
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>모집 현황</span>
                <span>{appliedCount} / {contest.team_max}명</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${Math.min((appliedCount / contest.team_max) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              {contest.contest_applications?.map((app: any) => (
                <div key={app.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center text-sm font-bold text-amber-700">
                    {app.user?.name?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{app.user?.name}</div>
                    <div className="text-xs text-gray-500">{app.user?.department}</div>
                  </div>
                  <span className="badge bg-amber-100 text-amber-700 text-xs">{app.role_tag}</span>
                  {app.user_id === contest.creator_id && (
                    <span className="badge bg-primary-100 text-primary-700 text-xs">개설자</span>
                  )}
                </div>
              ))}
              {appliedCount === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">아직 팀원이 없습니다</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">팀 합류 신청</h3>
            {isCompleted ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">🎉</div>
                <p className="font-semibold text-gray-900 text-sm">팀원 모집 완료!</p>
                <p className="text-xs text-gray-500 mt-1">팀이 구성되었습니다</p>
              </div>
            ) : myApp ? (
              <div className="text-center py-2">
                <div className="text-3xl mb-2">✅</div>
                <p className="font-semibold text-gray-900 text-sm">참여 신청 완료</p>
                <p className="text-xs text-gray-500 mt-1">역할: {myApp.role_tag}</p>
              </div>
            ) : isCreator ? (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">내가 개설한 모집입니다</p>
              </div>
            ) : isExpired ? (
              <p className="text-center text-sm text-gray-500 py-4">모집이 마감되었습니다</p>
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

          <div className="card p-4 text-sm space-y-2 text-gray-600">
            <div className="flex justify-between">
              <span>현재 팀원</span>
              <span className="font-semibold text-gray-900">{appliedCount}명</span>
            </div>
            <div className="flex justify-between">
              <span>목표 인원</span>
              <span className="font-semibold text-gray-900">{contest.team_min}~{contest.team_max}명</span>
            </div>
            <div className="flex justify-between">
              <span>모집 마감</span>
              <span className={`font-semibold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                {isExpired ? '마감됨' : `D-${daysLeft}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}