'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CONTEST_CATEGORIES, ROLES } from '@/lib/utils'
import { ArrowLeft, Plus } from 'lucide-react'

export default function NewContestPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    team_min: 2,
    team_max: 5,
    deadline: '',
  })
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))
  const toggleRole = (r: string) =>
    setSelectedRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('모집 제목을 입력해 주세요.'); return }
    if (!form.category) { setError('공모전 분야를 선택해 주세요.'); return }
    if (selectedRoles.length === 0) { setError('필요 역할을 하나 이상 선택해 주세요.'); return }
    if (form.team_min > form.team_max) { setError('최소 인원은 최대 인원보다 작아야 합니다.'); return }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: contest, error: err } = await supabase
      .from('contests')
      .insert({
        creator_id: user.id,
        title: form.title.trim(),
        category: form.category,
        description: form.description,
        team_min: form.team_min,
        team_max: form.team_max,
        deadline: form.deadline,
        required_roles: selectedRoles,
        status: 'recruiting',
        organizer: '',
      })
      .select()
      .single()

    if (err) { setError(err.message); setLoading(false); return }

    // Auto-join creator
    await supabase.from('contest_applications').insert({
      contest_id: contest.id,
      user_id: user.id,
      role_tag: selectedRoles[0],
      message: '팀 개설자',
    })

    router.push(`/contests/${contest.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/contests" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} /> 공모전 목록으로
      </Link>
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">공모전 팀원 모집</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="label" htmlFor="title">모집 제목 *</label>
            <input id="title" type="text" className="input-field"
              placeholder="예: 2024 창업 아이디어 공모전 팀원 구합니다"
              value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="category">공모전 분야 *</label>
            <select id="category" className="input-field" value={form.category} onChange={e => set('category', e.target.value)} required>
              <option value="">분야 선택</option>
              {CONTEST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="description">모집 내용 *</label>
            <textarea id="description" rows={4} className="input-field resize-none"
              placeholder="어떤 공모전을 준비하는지, 어떤 팀원이 필요한지 설명해 주세요"
              value={form.description} onChange={e => set('description', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="label">필요 역할 * (복수 선택 가능)</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ROLES.map(r => (
                <button key={r} type="button" onClick={() => toggleRole(r)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedRoles.includes(r)
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-amber-400'
                  }`}>{r}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label" htmlFor="team_min">최소 인원 *</label>
              <input id="team_min" type="number" className="input-field" min={2} max={10}
                value={form.team_min} onChange={e => set('team_min', parseInt(e.target.value))} required />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="team_max">최대 인원 *</label>
              <input id="team_max" type="number" className="input-field" min={2} max={10}
                value={form.team_max} onChange={e => set('team_max', parseInt(e.target.value))} required />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="deadline">모집 마감 *</label>
              <input id="deadline" type="date" className="input-field"
                value={form.deadline} onChange={e => set('deadline', e.target.value)} required />
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <div className="flex gap-3 pt-2">
            <Link href="/contests" className="btn-secondary flex-1 justify-center">취소</Link>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              <Plus size={18} />{loading ? '등록 중...' : '팀원 모집 시작'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}