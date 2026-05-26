'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SPORT_TYPES, DEPARTMENTS } from '@/lib/utils'
import { ArrowLeft, Plus } from 'lucide-react'

export default function NewSportMatchPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'department' | 'individual'>('department')
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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('경기 제목을 입력해 주세요.'); return }
    if (!form.sport_type) { setError('종목을 선택해 주세요.'); return }
    if (mode === 'department' && !form.dept_host) { setError('주최 학과를 선택해 주세요.'); return }
    if (form.min_players > form.max_players) { setError('최소 인원은 최대 인원보다 작아야 합니다.'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const payload: Record<string, unknown> = {
      creator_id: user.id, title: form.title.trim(), match_mode: mode,
      sport_type: form.sport_type, scheduled_at: form.scheduled_at,
      location: form.location, min_players: form.min_players,
      max_players: form.max_players, deadline: form.deadline,
      description: form.description || null,
    }
    if (mode === 'department') {
      payload.dept_host = form.dept_host
      payload.dept_guest = form.deptGuestOpen ? null : (form.dept_guest || null)
    }
    const { data: match, error: matchErr } = await supabase
      .from('sport_matches').insert(payload as any).select().single()
    if (matchErr) { setError(matchErr.message); setLoading(false); return }
    await supabase.from('sport_participants').insert({
      match_id: match.id, user_id: user.id,
      team_side: mode === 'department' ? 'host' : 'individual',
    })
    router.push(`/sports/${match.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/sports" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={16} /> 경기 목록으로
      </Link>
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">경기 개설</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="label">경기 유형 *</label>
            <div className="grid grid-cols-2 gap-3">
              {(['department', 'individual'] as const).map(m => (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${mode === m ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="font-semibold text-sm text-gray-900">{m === 'department' ? '🏫 학과 대항전' : '🙋 개인 매칭'}</div>
                  <div className="text-xs text-gray-500 mt-1">{m === 'department' ? '학과 vs 학과 형식의 팀전' : '학과 무관 개인 참여'}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="title">경기 제목 *</label>
            <input id="title" type="text" className="input-field" placeholder="예: 컴공 vs 전자공 풋살 대결"
              value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="sport_type">종목 *</label>
            <select id="sport_type" className="input-field" value={form.sport_type} onChange={e => set('sport_type', e.target.value)} required>
              <option value="">종목 선택</option>
              {SPORT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {mode === 'department' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label" htmlFor="dept_host">주최 학과 (내 팀) *</label>
                <select id="dept_host" className="input-field" value={form.dept_host} onChange={e => set('dept_host', e.target.value)}>
                  <option value="">학과 선택</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label" htmlFor="dept_guest">상대 학과</label>
                <div className="space-y-2">
                  <select id="dept_guest" className="input-field" value={form.deptGuestOpen ? '' : form.dept_guest}
                    onChange={e => set('dept_guest', e.target.value)} disabled={form.deptGuestOpen}>
                    <option value="">학과 선택</option>
                    {DEPARTMENTS.filter(d => d !== form.dept_host).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={form.deptGuestOpen} onChange={e => set('deptGuestOpen', e.target.checked)} className="rounded" />
                    어느 학과든 모집
                  </label>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label" htmlFor="scheduled_at">경기 일시 *</label>
              <input id="scheduled_at" type="datetime-local" className="input-field" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="deadline">신청 마감 *</label>
              <input id="deadline" type="datetime-local" className="input-field" value={form.deadline} onChange={e => set('deadline', e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="location">장소 *</label>
            <input id="location" type="text" className="input-field" placeholder="예: 학생회관 체육관 1층" value={form.location} onChange={e => set('location', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label" htmlFor="min_players">{mode === 'department' ? '팀당 최소 인원 *' : '최소 참여 인원 *'}</label>
              <input id="min_players" type="number" className="input-field" min={1} max={30} value={form.min_players} onChange={e => set('min_players', parseInt(e.target.value))} required />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="max_players">{mode === 'department' ? '팀당 최대 인원 *' : '최대 참여 인원 *'}</label>
              <input id="max_players" type="number" className="input-field" min={1} max={50} value={form.max_players} onChange={e => set('max_players', parseInt(e.target.value))} required />
            </div>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="description">경기 설명 (선택)</label>
            <textarea id="description" rows={3} className="input-field resize-none" placeholder="경기 방식, 준비물, 주의사항 등"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <div className="flex gap-3 pt-2">
            <Link href="/sports" className="btn-secondary flex-1 justify-center">취소</Link>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              <Plus size={18} />{loading ? '등록 중...' : '경기 개설'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}