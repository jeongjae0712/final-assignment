import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Users, Calendar, MapPin, Monitor } from 'lucide-react'
import { STUDY_CATEGORIES, formatDate, getDaysLeft, getStatusColor, getStatusLabel } from '@/lib/utils'

interface PageProps {
  searchParams: { category?: string; status?: string; type?: string }
}

export default async function StudiesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('studies')
    .select(`
      *,
      creator:users(name, department),
      study_applications(id, user_id, status)
    `)
    .eq('status', 'recruiting')
    .order('created_at', { ascending: false })

  if (searchParams.category) query = query.contains('category_tags', [searchParams.category])
  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.type) query = query.eq('location_type', searchParams.type)

  const { data: studies } = await query

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">스터디 모집</h1>
          <p className="text-gray-500 mt-1">스터디를 개설하거나 원하는 스터디에 참여하세요</p>
        </div>
        <Link href="/studies/new" className="btn-primary">
          <Plus size={18} /> 스터디 개설
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/studies"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !searchParams.category && !searchParams.status && !searchParams.type
              ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
          }`}>전체</Link>

        {STUDY_CATEGORIES.map(cat => (
          <Link key={cat} href={`/studies?category=${cat}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              searchParams.category === cat
                ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
            }`}>{cat}</Link>
        ))}

        <span className="text-gray-300 self-center">|</span>
        <Link href="/studies?status=recruiting"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            searchParams.status === 'recruiting'
              ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
          }`}>모집 중</Link>
        <Link href="/studies?status=active"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            searchParams.status === 'active'
              ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
          }`}>진행 중</Link>

        <span className="text-gray-300 self-center">|</span>
        <Link href="/studies?type=online"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            searchParams.type === 'online'
              ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
          }`}>온라인</Link>
        <Link href="/studies?type=offline"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            searchParams.type === 'offline'
              ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
          }`}>오프라인</Link>
      </div>

      {/* Grid */}
      {studies?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {studies.map((study: any) => {
            const acceptedCount = study.study_applications?.filter(
              (a: any) => a.status === 'accepted'
            ).length ?? 0
            const myApp = study.study_applications?.find((a: any) => a.user_id === user?.id)
            const isCreator = study.creator_id === user?.id
            const daysLeft = getDaysLeft(study.recruit_deadline)

            return (
              <Link key={study.id} href={`/studies/${study.id}`}
                className="card p-5 block hover:border-primary-200 hover:shadow-md transition-all group">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
                      {study.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {study.creator?.name} · {study.creator?.department}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`badge text-xs ${getStatusColor(study.status)}`}>
                      {getStatusLabel(study.status)}
                    </span>
                    {isCreator && <span className="badge bg-primary-100 text-primary-600 text-xs">개설자</span>}
                    {myApp && !isCreator && (
                      <span className={`badge text-xs ${getStatusColor(myApp.status)}`}>
                        {getStatusLabel(myApp.status)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {study.category_tags?.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="badge bg-green-100 text-green-700 text-xs">{tag}</span>
                  ))}
                </div>

                {/* Info */}
                <div className="space-y-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    {study.location_type === 'online'
                      ? <Monitor size={13} className="shrink-0" />
                      : <MapPin size={13} className="shrink-0" />
                    }
                    <span className="truncate">
                      {study.location_type === 'online' ? '온라인' : study.location ?? '오프라인'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={13} />
                    <span>{acceptedCount + 1} / {study.max_members}명</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-1">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min(((acceptedCount + 1) / study.max_members) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>모집 마감 {formatDate(study.recruit_deadline)}</span>
                    {daysLeft > 0 && daysLeft <= 7 && (
                      <span className="badge text-xs bg-amber-100 text-amber-700">D-{daysLeft}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">스터디 없음</h3>
          <p className="text-gray-400 text-sm mb-4">
            {searchParams.category ? '해당 분야의 스터디가 없습니다.' : '아직 등록된 스터디가 없습니다.'}
          </p>
          <Link href="/studies/new" className="btn-primary justify-center">
            <Plus size={16} /> 스터디 개설
          </Link>
        </div>
      )}
    </div>
  )
}
