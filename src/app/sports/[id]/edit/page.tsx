'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SPORT_TYPES, DEPARTMENTS } from '@/lib/utils'
import { ArrowLeft, Save } from 'lucide-react'

export default function EditSportMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()

  const [matchId, setMatchId] = useState<string>('')
  const [form, setForm] = useState({
    title: '',
    sport_type: '',
    dept_host: '',
    dept_guest: '',
    deptGuestOpen: false,
    scheduled_at: '',
    location: '',
    min_players: 5,
    max_players: 10,
    deadline: '',
    description: '',
  })
  const [mode, setMode] = useState<'department' | 'individual'>('department')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const load = async () => {
      const { id } = await params
      setMatchId(id)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: match, error } = await supabase
        .from('sport_matches')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !match) { router.push('/mypage'); return }
      if (match.creator_id !== user.id) { router.push(`/sports/${id}`); return }

      setMode(match.match_mode)
      setForm({
        title: match.title ?? '',
        sport_type: match.sport_type ?? '',
        dept_host: match.dept_host ?? '',
        dept_guest: match.dept_guest ?? '',
        deptGuestOpen: !match.dept_guest,
        scheduled_at: match.scheduled_at ? match.scheduled_at.slice(0, 16) : '',
        location: match.location ?? '',
        min_players: match.min_players ?? 5,
        max_players: match.max_players ?? 10,
        deadline: match.deadline ? match.deadline.slice(0, 16) : '',
        description: match.description ?? '',
      })
      setFetching(false)
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('경기 제목을 입력해 주세요.'); return }
    if (!form.sport_type) { setError('종목을 선택해 주세요.'); return }
    if (mode === 'department' && !form.dept_host) { setError('주최 학과를 선택해 주세요.'); return }
    if (form.min_players > form.max_players) { setError('최소 인원은 최대 인원보다 작아야 합니다.'); return }

    setLoading(true)

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      sport_type: form.sport_type,
      scheduled_at: form.scheduled_at,
      location: form.location,
      min_players: form.min_players,
      max_players: form.max_players,
      deadline: form.deadline,
      description: form.description || null,
    }

    if (mode === 'department') {
      payload.dept_host = form.dept_host
      payload.dept_guest = form.deptGuestOpen ? null : (form.dept_guest || null)
    }

    const { error: updateErr } = await supabase
      .from('sport_matches')
      .update(payload)
      .eq('id', matchId)

    if (updateErr) { setError(updateErr.message); setLoading(false); return }

    router.push(`/sports/${matchId}`)
    router.refresh()
  }

  if (fetching) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-400">
        불러오는 중...
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/mypage" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} /> 마이페이지로
      </Link>

      <div className="card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">경기 정보 수정</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 경기 유형 (변경 불가) */}
          <div className="form-group">
            <label className="label">경기 유형</label>
            <div className={`p-4 rounded-lg border-2 border-primary-500 bg-primary-50 inline-block`}>
              <div className="font-semibold text-sm text-gray-900">
                {mode === 'department' ? '🏫 학과 대항전' : '🙋 개인 매칭'}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">개설 후 유형 변경 불가</div>
            </div>
          </div>

          {/* 제목 */}
          <div className="form-group">
            <label className="label" htmlFor="title">경기 제목 *</label>
            <input id="title" type="text" className="input-field"
              value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>

          {/* 종목 */}
          <div className="form-group">
            <label className="label" htmlFor="sport_type">종목 *</label>
            <select id="sport_type" className="input-field" value={form.sport_type} onChange={e => set('sport_type', e.target.value)} required>
              <option value="">종목 선택</option>
              {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 학과 */}
          {mode === 'department' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label" htmlFor="dept_host">주최 학과 *</label>
                <select id="dept_host" className="input-field" value={form.dept_host} onChange={e => set('dept_host', e.target.value)}>
                  <option value="">학과 선택</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label" htmlFor="dept_guest">상대 학과</label>
                <select id="dept_guest" className="input-field"
                  value={form.deptGuestOpen ? '' : form.dept_guest}
                  onChange={e => set('dept_guest', e.target.value)}
                  disabled={form.deptGuestOpen}>
                  <option value="">학과 선택</option>
                  {DEPARTMENTS.filter(d => d !== form.dept_host).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mt-1.5">
                  <input type="checkbox" checked={form.deptGuestOpen} onChange={e => set('deptGuestOpen', e.target.checked)} className="rounded" />
                  어느 학과든 모집
                </label>
              </div>
            </div>
          )}

          {/* 일시 & 마감 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label" htmlFor="scheduled_at">경기 일시 *</label>
              <input id="scheduled_at" type="datetime-local" className="input-field"
                value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="deadline">신청 마감 *</label>
              <input id="deadline" type="datetime-local" className="input-field"
                value={form.deadline} onChange={e => set('deadline', e.target.value)} required />
            </div>
          </div>

          {/* 장소 */}
          <div className="form-group">
            <label className="label" htmlFor="location">장소 *</label>
            <input id="location" type="text" className="input-field"
              value={form.location} onChange={e => set('location', e.target.value)} required />
          </div>

          {/* 인원 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label" htmlFor="min_players">
                {mode === 'department' ? '팀당 최소 권장 인원' : '최소 참여 인원 *'}
              </label>
              <input id="min_players" type="number" className="input-field" min={1} max={30}
                value={form.min_players} onChange={e => set('min_players', parseInt(e.target.value))} required />
              {mode === 'department' && <p className="text-xs text-gray-400 mt-1">참고용 권장 인원</p>}
            </div>
            <div className="form-group">
              <label className="label" htmlFor="max_players">
                {mode === 'department' ? '팀당 최대 권장 인원' : '최대 참여 인원 *'}
              </label>
              <input id="max_players" type="number" className="input-field" min={1} max={50}
                value={form.max_players} onChange={e => set('max_players', parseInt(e.target.value))} required />
            </div>
          </div>

          {/* 설명 */}
          <div className="form-group">
            <label className="label" htmlFor="description">경기 설명 (선택)</label>
            <textarea id="description" rows={3} className="input-field resize-none"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <div className="flex gap-3 pt-2">
            <Link href="/mypage" className="btn-secondary flex-1 justify-center">취소</Link>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              <Save size={18} />
              {loading ? '저장 중...' : '변경 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
