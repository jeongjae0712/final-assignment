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
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    department: '',
    studentNumber: '',
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

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

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          department: form.department,
          student_number: form.studentNumber,
          interest_tags: selectedTags,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? '이미 등록된 이메일입니다.'
        : error.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center card p-10">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">이메일 인증을 완료해 주세요</h2>
          <p className="text-gray-500 text-sm">
            <strong>{form.email}</strong>으로 인증 메일을 발송했습니다.<br />
            메일의 링크를 클릭하면 가입이 완료됩니다.
          </p>
          <Link href="/auth/login" className="btn-primary mt-6 justify-center">
            로그인 페이지로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-3xl font-bold text-gray-900">UniMatch</h1>
          <p className="text-gray-500 mt-2">회원가입</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group col-span-2">
                <label className="label" htmlFor="email">학교 이메일 *</label>
                <input id="email" type="email" className="input-field"
                  placeholder="example@univ.ac.kr"
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="password">비밀번호 *</label>
                <input id="password" type="password" className="input-field"
                  placeholder="6자 이상"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="passwordConfirm">비밀번호 확인 *</label>
                <input id="passwordConfirm" type="password" className="input-field"
                  placeholder="비밀번호 재입력"
                  value={form.passwordConfirm} onChange={e => setForm(p => ({ ...p, passwordConfirm: e.target.value }))}
                  required />
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
                  placeholder="예: 20240001"
                  value={form.studentNumber} onChange={e => setForm(p => ({ ...p, studentNumber: e.target.value }))} />
              </div>

              <div className="form-group col-span-2">
                <label className="label" htmlFor="department">학과 *</label>
                <select id="department" className="input-field"
                  value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  required>
                  <option value="">학과 선택</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* 관심 분야 */}
            <div className="form-group">
              <label className="label">관심 분야 (선택)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {STUDY_CATEGORIES.map(tag => (
                  <button key={tag} type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                    }`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              <UserPlus size={18} />
              {loading ? '가입 처리 중...' : '회원가입'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-primary-600 hover:underline font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
