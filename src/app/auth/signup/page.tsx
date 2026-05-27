'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DEPARTMENTS, STUDY_CATEGORIES } from '@/lib/utils'
import { UserPlus } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    name: '',
    department: '',
    studentNumber: '',
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!/^[a-zA-Z0-9_]{4,20}$/.test(form.username)) {
      setError('아이디는 4~20자의 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.')
      return
    }
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }
    if (!form.department) {
      setError('학과를 선택해 주세요.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          name: form.name,
          department: form.department,
          studentNumber: form.studentNumber,
          interestTags: selectedTags,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? '회원가입에 실패했습니다.')
        setLoading(false)
        return
      }

      const fakeEmail = form.username + '@cbnumatch.app'
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: form.password,
      })

      if (signInError) {
        setError('회원가입이 완료되었습니다. 로그인 페이지에서 로그인해 주세요.')
        setLoading(false)
        router.push('/auth/login')
        return
      }

      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setError('서버 연결에 실패했습니다: ' + (err instanceof Error ? err.message : String(err)))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-3xl font-bold text-gray-900">CBNUMatch</h1>
          <p className="text-gray-500 mt-2">회원가입</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group col-span-2">
                <label className="label" htmlFor="username">아이디 *</label>
                <input id="username" type="text" className="input-field"
                  placeholder="영문/숫자/밑줄, 4~20자"
                  value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  required autoComplete="username" />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="password">비밀번호 *</label>
                <input id="password" type="password" className="input-field"
                  placeholder="6자 이상"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required autoComplete="new-password" />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="passwordConfirm">비밀번호 확인 *</label>
                <input id="passwordConfirm" type="password" className="input-field"
                  placeholder="비밀번호 재입력"
                  value={form.passwordConfirm} onChange={e => setForm(p => ({ ...p, passwordConfirm: e.target.value }))}
                  required autoComplete="new-password" />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="name">이름 *</label>
                <input id="name" type="text" className="input-field"
                  placeholder="이름 입력"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="studentNumber">학번</label>
                <input id="studentNumber" type="text" className="input-field"
                  placeholder="예: 2024000001"
                  value={form.studentNumber} onChange={e => setForm(p => ({ ...p, studentNumber: e.target.value }))} />
              </div>

              <div className="form-group col-span-2">
                <label className="label" htmlFor="department">학과 *</label>
                <select id="department" className="input-field"
                  value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} required>
                  <option value="">학과 선택</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">관심 분야 (선택)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {STUDY_CATEGORIES.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                    }`}>{tag}</button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              <UserPlus size={18} />
              {loading ? '가입 처리 중...' : '회원가입'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  )
}