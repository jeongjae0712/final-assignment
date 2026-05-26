export const SPORT_TYPES = ['축구', '농구', '풋살', '배드민턴', '탁구', '배구', '테니스', '야구', '기타']

export const DEPARTMENTS = [
  '컴퓨터공학과', '전자공학과', '기계공학과', '화학공학과', '산업공학과',
  '경영학과', '경제학과', '경영정보학과', '회계학과',
  '국어국문학과', '영어영문학과', '사학과', '철학과',
  '수학과', '물리학과', '화학과', '생명과학과',
  '간호학과', '의학과', '약학과',
  '체육교육과', '스포츠과학과',
  '디자인학과', '건축학과', '도시공학과',
  '법학과', '행정학과', '사회학과',
  '미디어커뮤니케이션학과', '신문방송학과',
  '기타',
]

export const STUDY_CATEGORIES = [
  '어학', '취업/인턴', '전공공부', '자격증', '코딩/개발', '프로젝트', '독서', '기타',
]

export const CONTEST_CATEGORIES = [
  '창업/경영', '개발/IT', '디자인', '마케팅', '데이터/AI', '사회적기업', '기타',
]

export const ROLES = ['기획', '개발', '디자인', '마케팅', '데이터분석', '영상/사진', '기타']

export function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  return formatDate(dateStr)
}

export function getDaysLeft(deadlineStr: string) {
  const deadline = new Date(deadlineStr)
  const now = new Date()
  return Math.ceil((deadline.getTime() - now.getTime()) / 86400000)
}

export function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    open: '모집 중', matched: '매칭 성사', cancelled: '취소됨',
    recruiting: '모집 중', active: '진행 중', expired: '만료됨',
    pending: '대기 중', confirmed: '확정', waitlisted: '대기자',
    waiting: '매칭 대기', accepted: '수락됨', rejected: '거절됨',
  }
  return map[status] ?? status
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800', recruiting: 'bg-blue-100 text-blue-800',
    waiting: 'bg-blue-100 text-blue-800', pending: 'bg-yellow-100 text-yellow-800',
    matched: 'bg-green-100 text-green-800', active: 'bg-green-100 text-green-800',
    confirmed: 'bg-green-100 text-green-800', accepted: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800', expired: 'bg-gray-100 text-gray-800',
    waitlisted: 'bg-orange-100 text-orange-800', rejected: 'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-800'
}
