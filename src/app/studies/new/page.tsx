'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { STUDY_CATEGORIES } from '@/lib/utils'
import { ArrowLeft, Plus } from 'lucide-react'

export default function NewStudyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    description: '',
    schedule: '',
    location_type: 'offline' as 'online' | 'offline',
    location: '',
    min_members: 2,
    max_members: 6,
    recruit_deadline: '',
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))
  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (selectedTags.length === 0) { setError('분야 태그를 하나 이상 선택해 주세요.'); return }
    if (form.min_members > form.max_members) { setError('최소 인원은 최대 인원보다 작아야 합니다.'); return }
    if (form.location_type === 'offline' && !form.location) { setError('오프라인 장소를 입력해 주세요.'); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: study, error: err } = await supabase
      .from('studies')
      .insert({
        creator_id: user.id,
        title: form.title,
        category_tags: selectedTags,
        description: form.description,
        schedule: form.schedule,
        location_type: form.location_type,
        location: form.location_type === 'offline' ? form.location : null,
        min_members: form.min_members,
        max_members: form.max_members,
        recruit_deadline: form.recruit_deadline,
      })
      .select()
      .single()

    if (err) { setError(err.message); setLoading(false); return }

    // Auto-register creator as accepted member
    await supabase.from('study_applications').insert({
      study_id: study.id,
      user_id: user.id,
      status: 'accepted',
      message: '스터디 개설자',
    })

    router.push(`/studies/${study.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/studies" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} /> 스터디 목록으로
      </Link>

      <div className="card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">스터디 개설</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div className="form-group">
            <label className="label" htmlFor="title">스터디 제목 *</label>
            <input id="title" type="text" className="input-field"
              placeholder="예: 2024 하반기 토익 950+ 스터디"
              value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>

          {/* 분야 태그 */}
          <div className="form-group">
            <label className="label">분야 태그 * (최소 1개)</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {STUDY_CATEGORIES.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                  }`}>{tag}</button>
              ))}
            </div>
          </div>

          {/* 설명 */}
          <div className="form-group">
            <label className="label" htmlFor="description">스터디 소개 *</label>
            <textarea id="description" rows={4} className="input-field resize-none"
              placeholder="스터디 목표, 진행 방식, 대상 수준, 참여 조건 등을 적어주세요"
              value={form.description} onChange={e => set('description', e.target.value)} required />
          </div>

          {/* 일정 */}
          <div className="form-group">
            <label className="label" htmlFor="schedule">일정 *</label>
            <input id="schedule" type="text" className="input-field"
              placeholder="예: 매주 화, 목 저녁 7시~9시 / 주 2회 2시간"
              value={form.schedule} onChange={e => set('schedule', e.target.value)} required />
          </div>

          {/* 장소 */}
          <div>
            <label className="label">진행 방식 *</label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {(['offline', 'online'] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => set('location_type', t)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    form.location_type === t
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {t === 'offline' ? '📍 오프라인' : '💻 온라인'}
                </button>
              ))}
            </div>
            {form.location_type === 'offline' && (
              <input type="text" className="input-field"
                placeholder="예: 도서관 4층 스터디룸 / 강의동 205호"
                value={form.location} onChange={e => set('location', e.target.value)} />
            )}
          </div>

          {/* 인원 & 마감 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label" htmlFor="min_members">최소 인원 *</label>
              <input id="min_members" type="number" className="input-field"
                min={2} max={20}
                value={form.min_members} onChange={e => set('min_members', parseInt(e.target.value))} required />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="max_members">최대 인원 *</label>
              <input id="max_members" type="number" className="input-field"
                min={2} max={50}
                value={form.max_members} onChange={e => set('max_members', parseInt(e.target.value))} required />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="recruit_deadline">모집 마감 *</label>
              <input id="recruit_deadline" type="date" className="input-field"
                value={form.recruit_deadline} onChange={e => set('recruit_deadline', e.target.value)} required />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link href="/studies" className="btn-secondary flex-1 justify-center">취소</Link>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              <Plus size={18} />
              {loading ? '등록 중...' : '스터디 개설'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
