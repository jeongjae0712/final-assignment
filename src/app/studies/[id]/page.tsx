import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Calendar, Users, MapPin, Monitor, Clock } from 'lucide-react'
import { formatDate, getDaysLeft, getStatusColor, getStatusLabel } from '@/lib/utils'
import StudyApplyButton from '@/components/studies/StudyApplyButton'
import StudyApplicationManager from '@/components/studies/StudyApplicationManager'

export default async function StudyDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: study } = await supabase
    .from('studies')
    .select(`
      *,
      creator:users(id, name, department, email),
      study_applications(
        id, user_id, message, status, applied_at,
        user:users(id, name, department)
      )
    `)
    .eq('id', params.id)
    .single()

  if (!study) notFound()

  const isCreator = study.creator_id === user?.id
  const myApp = study.study_applications?.find((a: any) => a.user_id === user?.id)
  const acceptedApps = study.study_applications?.filter((a: any) => a.status === 'accepted') ?? []
  const pendingApps = study.study_applications?.filter((a: any) => a.status === 'pending') ?? []
  const daysLeft = getDaysLeft(study.recruit_deadline)
  const isExpired = daysLeft < 0 || study.status === 'expired'
  const canActivate = acceptedApps.length >= study.min_members && study.status === 'recruiting'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/studies" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} /> 스터디 목록으로
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info card */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 mr-4">
                <h1 className="text-xl font-bold text-gray-900 mb-1">{study.title}</h1>
                <p className="text-sm text-gray-500">
                  개설자: {study.creator?.name} ({study.creator?.department})
                </p>
              </div>
              <span className={`badge text-sm px-3 py-1 ${getStatusColor(study.status)}`}>
                {getStatusLabel(study.status)}
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {study.category_tags?.map((tag: string) => (
                <span key={tag} className="badge bg-green-100 text-green-700">{tag}</span>
              ))}
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-5">
              <div className="flex items-start gap-2 text-gray-600">
                <Clock size={15} className="mt-0.5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-400">일정</div>
                  <div className="font-medium text-gray-800">{study.schedule}</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                {study.location_type === 'online'
                  ? <Monitor size={15} className="mt-0.5 text-gray-400" />
                  : <MapPin size={15} className="mt-0.5 text-gray-400" />}
                <div>
                  <div className="text-xs text-gray-400">진행 방식</div>
                  <div className="font-medium text-gray-800">
                    {study.location_type === 'online' ? '온라인' : study.location ?? '오프라인'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <Users size={15} className="mt-0.5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-400">인원</div>
                  <div className="font-medium text-gray-800">{study.min_members} ~ {study.max_members}명</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <Calendar size={15} className="mt-0.5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-400">모집 마감</div>
                  <div className="font-medium text-gray-800">
                    {formatDate(study.recruit_deadline)}
                    {!isExpired && daysLeft <= 7 && (
                      <span className="ml-2 badge bg-amber-100 text-amber-700 text-xs">D-{daysLeft}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-2">스터디 소개</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{study.description}</p>
            </div>
          </div>

          {/* Accepted members */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                참여 멤버 ({acceptedApps.length}/{study.max_members})
              </h3>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden mx-4">
                <div
                  className={`h-full rounded-full transition-all ${
                    acceptedApps.length >= study.min_members ? 'bg-green-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min((acceptedApps.length / study.max_members) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">최소 {study.min_members}명</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {acceptedApps.map((app: any) => (
                <div key={app.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-sm font-bold text-gray-600 border shadow-sm">
                    {app.user?.name?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{app.user?.name}</div>
                    <div className="text-xs text-gray-500 truncate">{app.user?.department}</div>
                  </div>
                  {study.creator_id === app.user_id && (
                    <span className="badge bg-primary-100 text-primary-600 text-xs">개설자</span>
                  )}
                </div>
              ))}
              {acceptedApps.length === 0 && (
                <p className="col-span-2 text-sm text-gray-400 text-center py-4">
                  아직 참여 멤버가 없습니다
                </p>
              )}
            </div>
          </div>

          {/* Pending applications (for creator) */}
          {isCreator && pendingApps.length > 0 && (
            <StudyApplicationManager
              studyId={study.id}
              applications={pendingApps}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status / Apply */}
          <div className="card p-5">
            {isCreator ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl mb-2">👑</div>
                  <p className="font-semibold text-gray-900 text-sm">스터디 개설자</p>
                  {pendingApps.length > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      대기 중인 신청 {pendingApps.length}건
                    </p>
                  )}
                </div>
                {canActivate && study.status === 'recruiting' && (
                  <StudyActivateButton studyId={study.id} />
                )}
                {canActivate && (
                  <p className="text-xs text-green-600 text-center">
                    ✅ 최소 인원 충족! 스터디를 시작할 수 있습니다.
                  </p>
                )}
              </div>
            ) : myApp ? (
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {myApp.status === 'accepted' ? '✅' : myApp.status === 'rejected' ? '❌' : '⏳'}
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  {myApp.status === 'accepted' ? '참여 확정' : myApp.status === 'rejected' ? '신청 거절' : '수락 대기 중'}
                </p>
                <span className={`badge mt-1 ${getStatusColor(myApp.status)}`}>
                  {getStatusLabel(myApp.status)}
                </span>
              </div>
            ) : study.status !== 'recruiting' || isExpired ? (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">
                  {study.status === 'active' ? '이미 진행 중인 스터디입니다' : '모집이 종료되었습니다'}
                </p>
              </div>
            ) : acceptedApps.length >= study.max_members ? (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">인원이 모두 찼습니다</p>
              </div>
            ) : (
              <StudyApplyButton studyId={study.id} userId={user?.id} />
            )}
          </div>

          {/* Stats */}
          <div className="card p-4 text-sm space-y-2 text-gray-600">
            <div className="flex justify-between">
              <span>확정 멤버</span>
              <span className="font-semibold text-gray-900">{acceptedApps.length}명</span>
            </div>
            <div className="flex justify-between">
              <span>대기 신청</span>
              <span className="font-semibold text-amber-600">{pendingApps.length}명</span>
            </div>
            <div className="flex justify-between">
              <span>최소/최대</span>
              <span className="font-semibold text-gray-900">{study.min_members}/{study.max_members}명</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

