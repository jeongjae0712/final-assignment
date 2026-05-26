# PRD: 대학교 스포츠·공모전·스터디 매칭 시스템

**문서 버전:** 1.1  
**작성일:** 2026-05-26  
**분류:** 시스템 분석과 설계 기말과제

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-05-26 | 최초 작성 |
| 1.1 | 2026-05-26 | Supabase 전체 백엔드 통합 / GitHub+Vercel 배포 스택 추가 / 스포츠 경기 등록 주체를 관리자→사용자로 변경 |

---

## 1. 개요 (Overview)

### 1.1 제품 비전

대학교 내 학생들이 스포츠 경기, 공모전, 스터디 활동에 손쉽게 참여할 수 있도록 연결해 주는 통합 매칭 플랫폼. 학생이 직접 활동을 개설·등록하고, 인원 충족 시 자동으로 매칭을 성사시킨다.

### 1.2 목표

- 교내 활동 참여율 향상 및 학과 간 교류 증진
- 공모전 팀 빌딩에 드는 탐색 비용 절감
- 스터디 그룹 결성의 진입 장벽 낮추기
- 모든 활동을 하나의 플랫폼에서 관리

### 1.3 범위 (Scope)

| 포함 | 제외 |
|------|------|
| 스포츠 경기 개설 및 매칭 | 교외 스포츠 리그 |
| 공모전 정보 조회 및 팀 매칭 | 공모전 직접 주최 |
| 스터디 개설 및 참여 매칭 | 스터디 콘텐츠 제공 |
| 실시간 알림 | 화상 회의 기능 |

---

## 2. 기술 스택 (Tech Stack)

| 구분 | 기술 | 비고 |
|------|------|------|
| **프론트엔드** | Next.js (React) | App Router, TypeScript |
| **백엔드 / DB** | Supabase | PostgreSQL, Auth, Realtime, Storage |
| **인증** | Supabase Auth | 이메일 인증, JWT |
| **실시간** | Supabase Realtime | 인원 현황 실시간 반영 |
| **코드 관리** | GitHub | 버전 관리, PR 기반 협업 |
| **배포** | Vercel | GitHub 연동 자동 배포 (Preview / Production) |
| **스타일링** | Tailwind CSS | 반응형 UI |

### 2.1 Supabase 역할 정의

Supabase는 별도 백엔드 서버 없이 프론트엔드에서 직접 연동하는 **단일 백엔드**로 사용한다.

| Supabase 기능 | 사용 목적 |
|--------------|----------|
| **Database** | 사용자, 경기, 공모전, 스터디 데이터 저장 |
| **Auth** | 회원가입·로그인·세션 관리 |
| **Row Level Security (RLS)** | 사용자별 데이터 접근 권한 제어 |
| **Realtime** | 경기·스터디 인원 현황 실시간 구독 |
| **Edge Functions** | 매칭 성사 판단 로직, 알림 발송 트리거 |
| **Storage** | 프로필 이미지 등 파일 저장 |

### 2.2 배포 파이프라인

```
개발자 로컬
    │  git push
    ▼
GitHub Repository
    │  Vercel GitHub 연동 (자동 감지)
    ├─► PR 생성 시 → Vercel Preview URL 자동 생성
    └─► main 브랜치 머지 시 → Vercel Production 자동 배포
```

---

## 3. 이해관계자 (Stakeholders)

| 역할 | 설명 |
|------|------|
| 일반 학생 | 스포츠·공모전·스터디에 참여하고 경기·스터디를 직접 개설 |
| 학과 대표 | 학과 대항전 경기를 개설하고 자기 학과 참여자를 모집 |
| 관리자 | 부적절 게시물 신고 처리, 시스템 운영 (경기 등록 X) |

---

## 4. 사용자 페르소나

### 페르소나 A — 경기 개설자 "김대표"
- 컴퓨터공학과 학과 대표 3학년
- 전기공학과와 풋살 경기를 잡고 싶지만 상대 학과 섭외가 어려움
- 직접 경기 공고를 올리고 상대 학과 지원을 받고 싶음

### 페르소나 B — 스포츠 참여자 "이농구"
- 체육교육과 2학년
- 학과 대항전이 아닌 개인 단위 농구 경기에 참여하고 싶음
- 실력 비슷한 사람들끼리 팀을 구성하고 싶음

### 페르소나 C — 공모전 지망생 "박기획"
- 경영학과 3학년
- 공모전 정보를 매번 직접 찾아야 해서 번거로움
- 같은 공모전을 노리는 팀원을 찾기 어려움

### 페르소나 D — 스터디 개설자 "최공부"
- 전자공학과 4학년
- 토익 스터디를 만들고 싶지만 참여자 모집 채널이 없음
- 원하는 수준·일정에 맞는 사람을 찾기 힘듦

---

## 5. 기능 요구사항 (Functional Requirements)

---

### 5.1 공통 기능

#### 5.1.1 회원가입 / 로그인 (Supabase Auth)
- **FR-AUTH-01:** 학교 이메일(@대학도메인)로만 회원가입 가능
- **FR-AUTH-02:** Supabase Auth 이메일 인증 후 계정 활성화
- **FR-AUTH-03:** 프로필 정보 입력: 학과, 학번, 이름, 관심 분야 태그
- **FR-AUTH-04:** Supabase Auth JWT 세션으로 인증 상태 관리
- **FR-AUTH-05:** 소셜 로그인 지원 (Google OAuth, 선택)

#### 5.1.2 알림
- **FR-NOTIF-01:** 매칭 성사 시 참여자 전원에게 인앱 알림
- **FR-NOTIF-02:** 내가 개설한 활동에 신청자 발생 시 알림
- **FR-NOTIF-03:** 신청한 활동의 수락/거절 시 알림
- **FR-NOTIF-04:** 활동 마감 D-1 리마인더 알림
- *(알림 저장: Supabase notifications 테이블 + Realtime 구독)*

---

### 5.2 스포츠 경기 매칭

#### 5.2.1 경기 개설 (사용자 — 학과 대표 또는 일반 학생)

경기 등록은 관리자가 아닌 **사용자가 직접 수행**한다. 경기 유형에 따라 두 가지 모드를 지원한다.

**[모드 A] 학과 대항전**
- **FR-SPORT-01:** 개설자가 경기 정보 입력: 종목, 날짜/시간, 장소, 자기 학과, 상대 학과(단일 지정 또는 "모든 학과 모집"), 팀당 최소/최대 인원, 신청 마감일
- **FR-SPORT-02:** 상대 학과를 특정하지 않을 경우 "학과 모집 중" 상태로 전체 공개 → 먼저 도전 신청한 학과가 상대로 확정
- **FR-SPORT-03:** 개설자는 자동으로 자기 학과 팀의 첫 번째 참여자로 등록
- **FR-SPORT-04:** 경기 개설 후 수정은 신청자 0명일 때만 허용, 삭제는 개설자만 가능

**[모드 B] 개인 매칭**
- **FR-SPORT-05:** 개설자가 종목, 일시, 장소, 총 참여 인원(최소/최대)을 입력하여 학과 무관 개인 단위 모집
- **FR-SPORT-06:** 개설자는 자동으로 첫 번째 참여자로 등록

#### 5.2.2 경기 탐색 및 참여

- **FR-SPORT-07:** 전체 경기 목록 공개 조회 가능 (종목, 날짜, 모드, 모집 상태 필터)
- **FR-SPORT-08:** 학과 대항전의 경우 상대 학과 팀으로 참여하려면 해당 학과 소속이어야 함 (RLS 검증)
- **FR-SPORT-09:** 개인 매칭의 경우 학과 무관 누구나 참여 신청 가능
- **FR-SPORT-10:** 동일 시간대 중복 참여 신청 불가 (시간 충돌 검사)
- **FR-SPORT-11:** 참여 신청 시 한 줄 자기소개 입력 (선택)

#### 5.2.3 매칭 성사 로직

- **FR-SPORT-12:** [학과 대항전] 양 팀 모두 최소 인원 도달 시 Supabase Edge Function이 자동으로 매칭 성사 처리
- **FR-SPORT-13:** [개인 매칭] 최소 인원 도달 시 자동 성사 또는 개설자가 수동 확정 (개설 시 선택)
- **FR-SPORT-14:** 매칭 성사 후 추가 신청 마감, 잔여 자리 있으면 대기자 전환
- **FR-SPORT-15:** 마감일 전까지 인원 미충족 시 자동 취소, 참여자에게 알림

#### 5.2.4 경기 현황

- **FR-SPORT-16:** Supabase Realtime으로 인원 현황 실시간 반영 (A팀 3/5명, B팀 2/5명)
- **FR-SPORT-17:** 매칭 성사 시 양 팀 참여자 명단 구성원 간 공개

---

### 5.3 공모전 매칭

#### 5.3.1 공모전 데이터 관리 (Supabase)

- **FR-CONTEST-01:** 공모전 데이터는 Supabase `contests` 테이블에 저장·관리
- **FR-CONTEST-02:** 관리자 또는 크롤러가 Supabase 테이블에 공모전 정보를 직접 입력/갱신
- **FR-CONTEST-03:** Next.js 서버 컴포넌트에서 Supabase Client로 공모전 데이터 직접 조회 (별도 API 서버 없음)
- **FR-CONTEST-04:** 공모전 목록: 분야, 마감일, 팀 규모 조건 필터링
- **FR-CONTEST-05:** 공모전 상세 페이지: 주최, 주제, 마감일, 시상 내역, 팀 구성 조건, 필요 역할 표시
- **FR-CONTEST-06:** 공모전 북마크(관심 등록) 기능

#### 5.3.2 공모전 팀 매칭

- **FR-CONTEST-07:** 공모전별 "팀 합류 신청" — 역할 태그 선택 (기획, 개발, 디자인, 마케팅 등)
- **FR-CONTEST-08:** 팀 구성 조건(최소 인원 + 역할 다양성) 충족 시 Supabase Edge Function이 매칭 자동 성사
- **FR-CONTEST-09:** 매칭 성사 후 팀원 연락처(이메일) 상호 공개 및 알림 발송
- **FR-CONTEST-10:** 공모전 마감일 기준 신청 자동 종료

---

### 5.4 스터디 매칭

#### 5.4.1 스터디 개설

- **FR-STUDY-01:** 개설자가 스터디 정보 입력: 제목, 분야 태그, 목표, 일정, 장소(온/오프라인), 최소/최대 인원, 모집 마감일, 참여 조건 설명
- **FR-STUDY-02:** 분야 태그: 어학, 취업, 전공, 자격증, 프로젝트 등
- **FR-STUDY-03:** 개설자 자동으로 첫 번째 참여자 등록

#### 5.4.2 스터디 참여

- **FR-STUDY-04:** 스터디 목록 조회: 분야, 일정, 인원 현황 필터링
- **FR-STUDY-05:** 신청 시 지원 동기 입력 (선택)
- **FR-STUDY-06:** 개설자가 신청자 수락/거절 처리
- **FR-STUDY-07:** 최소 인원 충족 시 개설자에게 "스터디 시작" 확정 버튼 활성화
- **FR-STUDY-08:** 최대 인원 도달 시 추가 신청 자동 마감

#### 5.4.3 스터디 관리

- **FR-STUDY-09:** 개설자가 스터디 정보 수정 및 조기 마감 가능 (신청자 0명 시 삭제 허용)
- **FR-STUDY-10:** 모집 마감일 초과 후 인원 미충족 시 자동 만료
- **FR-STUDY-11:** 성사된 스터디의 참여자 명단 구성원 간 공개

---

## 6. 비기능 요구사항 (Non-Functional Requirements)

| 항목 | 요구사항 |
|------|---------|
| **성능** | 주요 페이지 로딩 3초 이내 (Vercel Edge Network 활용), 인원 현황 Realtime 갱신 2초 이내 |
| **가용성** | Vercel + Supabase SLA 기반 99% 이상 |
| **보안** | Supabase RLS로 행 단위 접근 제어, HTTPS 강제, 학교 이메일 인증 필수 |
| **확장성** | Supabase 무료 티어 → Pro 티어 전환으로 트래픽 증가 대응 |
| **접근성** | 모바일·데스크톱 반응형 UI (Tailwind CSS) |
| **데이터 정합성** | 인원 카운트 Race Condition 방지 → Supabase PostgreSQL 트랜잭션 + Edge Function 내 원자적 처리 |

---

## 7. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│              클라이언트 (Browser / Mobile Web)             │
│          Next.js (App Router, Server Components)         │
│                  배포: Vercel                             │
└────────────┬────────────────────────┬────────────────────┘
             │ Supabase JS Client      │ Supabase Realtime
             │ (서버 컴포넌트 직접 조회)  │ (인원 현황 구독)
             ▼                        ▼
┌─────────────────────────────────────────────────────────┐
│                        Supabase                          │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │   Auth   │  │  DB      │  │    Edge Functions       │ │
│  │ (JWT,    │  │(PostgreSQL│  │ - 매칭 성사 판단        │ │
│  │  이메일)  │  │ + RLS)   │  │ - 알림 발송 트리거      │ │
│  └──────────┘  └──────────┘  └────────────────────────┘ │
│                                                          │
│  ┌──────────┐  ┌──────────────────────────────────────┐ │
│  │ Storage  │  │           Realtime                    │ │
│  │(프로필   │  │  (경기/스터디 인원 현황 실시간 구독)    │ │
│  │ 이미지)  │  └──────────────────────────────────────┘ │
│  └──────────┘                                            │
└─────────────────────────────────────────────────────────┘

코드 흐름:
  개발자 → GitHub Push → Vercel 자동 감지
  PR → Vercel Preview 배포
  main merge → Vercel Production 배포
```

---

## 8. 데이터 모델 (Supabase PostgreSQL 테이블)

### 8.1 users (프로필 — auth.users 확장)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK, FK → auth.users.id |
| email | TEXT | 학교 이메일 |
| name | TEXT | 이름 |
| department | TEXT | 학과 |
| student_number | TEXT | 학번 |
| interest_tags | TEXT[] | 관심 분야 태그 |
| created_at | TIMESTAMPTZ | 가입일 |

### 8.2 sport_matches (스포츠 경기)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| creator_id | UUID | FK → users.id (개설자) |
| match_mode | TEXT | 'department' / 'individual' |
| sport_type | TEXT | 농구, 풋살, 배드민턴 등 |
| dept_host | TEXT | 개설 학과 (모드 A) |
| dept_guest | TEXT | 상대 학과 (NULL = 모집 중) |
| scheduled_at | TIMESTAMPTZ | 경기 일시 |
| location | TEXT | 장소 |
| min_players | INT | 팀당(또는 전체) 최소 인원 |
| max_players | INT | 팀당(또는 전체) 최대 인원 |
| deadline | TIMESTAMPTZ | 신청 마감 |
| status | TEXT | 'open' / 'matched' / 'cancelled' |
| created_at | TIMESTAMPTZ | 등록일 |

### 8.3 sport_participants (스포츠 참여)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| match_id | UUID | FK → sport_matches.id |
| user_id | UUID | FK → users.id |
| team_side | TEXT | 'host' / 'guest' / 'individual' |
| intro | TEXT | 한 줄 소개 |
| status | TEXT | 'pending' / 'confirmed' / 'waitlisted' |
| joined_at | TIMESTAMPTZ | 신청 시각 |

### 8.4 contests (공모전)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| title | TEXT | 공모전명 |
| organizer | TEXT | 주최 기관 |
| category | TEXT | 분야 |
| description | TEXT | 상세 내용 |
| deadline | DATE | 접수 마감일 |
| team_min | INT | 최소 팀원 수 |
| team_max | INT | 최대 팀원 수 |
| required_roles | TEXT[] | 필요 역할 목록 |
| prize | TEXT | 시상 내역 |
| external_url | TEXT | 원본 공모전 링크 |
| created_at | TIMESTAMPTZ | 등록일 |

### 8.5 contest_applications (공모전 신청)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| contest_id | UUID | FK → contests.id |
| user_id | UUID | FK → users.id |
| role_tag | TEXT | 지원 역할 |
| team_id | UUID | 매칭 성사 시 팀 그룹 ID |
| status | TEXT | 'waiting' / 'matched' |
| applied_at | TIMESTAMPTZ | 신청 시각 |

### 8.6 studies (스터디)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| creator_id | UUID | FK → users.id |
| title | TEXT | 스터디명 |
| category_tags | TEXT[] | 분야 태그 |
| description | TEXT | 상세 설명 |
| schedule | TEXT | 일정 설명 |
| location_type | TEXT | 'online' / 'offline' |
| location | TEXT | 장소 |
| min_members | INT | 최소 인원 |
| max_members | INT | 최대 인원 |
| recruit_deadline | DATE | 모집 마감일 |
| status | TEXT | 'recruiting' / 'active' / 'expired' |
| created_at | TIMESTAMPTZ | 개설일 |

### 8.7 study_applications (스터디 신청)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| study_id | UUID | FK → studies.id |
| user_id | UUID | FK → users.id |
| message | TEXT | 지원 동기 |
| status | TEXT | 'pending' / 'accepted' / 'rejected' |
| applied_at | TIMESTAMPTZ | 신청 시각 |

### 8.8 notifications (알림)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → users.id (수신자) |
| type | TEXT | 알림 종류 (matched / applied / accepted 등) |
| ref_type | TEXT | 참조 엔티티 종류 (sport / contest / study) |
| ref_id | UUID | 참조 엔티티 ID |
| message | TEXT | 알림 내용 |
| is_read | BOOL | 읽음 여부 |
| created_at | TIMESTAMPTZ | 발생 시각 |

---

## 9. RLS (Row Level Security) 정책 요약

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| users | 본인만 전체 조회, 타인은 공개 필드만 | 가입 시 본인 | 본인만 | X |
| sport_matches | 전체 공개 | 로그인 사용자 | 개설자(본인)만 | 개설자(참여자 0명) |
| sport_participants | 본인 + 같은 경기 확정 참여자 | 로그인 사용자 | X | 본인만(취소) |
| contests | 전체 공개 | 관리자만 | 관리자만 | 관리자만 |
| contest_applications | 본인 + 같은 팀 매칭 후 | 로그인 사용자 | Edge Function | X |
| studies | 전체 공개 | 로그인 사용자 | 개설자만 | 개설자(신청자 0명) |
| study_applications | 본인 + 개설자 | 로그인 사용자 | 개설자(수락/거절) | 본인만(취소) |
| notifications | 본인만 | Edge Function | 본인(읽음 처리) | 본인만 |

---

## 10. 주요 유즈케이스 (Use Cases)

### UC-01: 학과 대항전 경기 개설 및 매칭

```
액터: 경기 개설자 (학과 대표 또는 일반 학생)
사전조건: 로그인 상태

[개설]
1. 개설자가 스포츠 탭 > "경기 개설" 선택
2. 모드 선택: 학과 대항전
3. 종목, 일시, 장소, 자기 학과, 상대 학과(또는 미정), 인원, 마감일 입력
4. 게시 → 개설자 자동 host 팀 참여자 등록

[참여]
5. 상대 학과 학생이 경기 목록에서 경기 발견
6. guest 팀으로 참여 신청

[매칭 성사]
7. 양 팀 모두 최소 인원 도달
8. Supabase Edge Function 실행:
   - sport_matches.status → 'matched'
   - 전체 참여자 notifications 레코드 삽입
9. Realtime으로 프론트엔드 즉시 반영
```

### UC-02: 개인 매칭 경기 개설 및 참여

```
액터: 개설자 + 참여 희망 학생
사전조건: 로그인 상태

1. 개설자가 모드: 개인 매칭 선택
2. 종목, 일시, 장소, 총 인원 입력
3. 최소 인원 도달 시 자동 성사 / 수동 확정 중 선택
4. 학과 무관 신청자 모집 → 설정 조건 충족 시 매칭 성사
```

### UC-03: 공모전 팀 매칭

```
액터: 학생
사전조건: 로그인 상태

1. 공모전 탭 > 분야·마감일 필터로 공모전 검색
2. 공모전 상세 확인 → "팀 합류 신청" + 역할 태그 선택
3. Supabase에 contest_applications 레코드 저장
4. Edge Function: 팀 조건(인원 + 역할 구성) 충족 여부 검사
5. 충족 시:
   - 해당 신청자들에게 동일 team_id 부여
   - notifications 삽입 → 팀원 이메일 상호 공개
```

### UC-04: 스터디 개설 및 매칭

```
액터: 개설자 + 신청자
사전조건: 로그인 상태

[개설]
1. 개설자가 스터디 정보 입력 후 게시
2. 개설자 자동 accepted 상태로 첫 참여자 등록

[신청·수락]
3. 신청자가 "신청하기" → study_applications 레코드 생성(pending)
4. 개설자가 수락 → status: accepted 갱신
5. accepted 인원이 min_members 도달 시 "시작 확정" 버튼 활성화
6. 개설자 확정 → studies.status: active, 참여자 알림
```

---

## 11. 화면 구성 (주요 UI 흐름)

```
홈 (대시보드)
├── 내 활동 카드 (참여 중인 경기·공모전·스터디)
├── 추천 활동 (관심 태그 기반)
│
스포츠 탭
├── 경기 목록 (종목·날짜·모드 필터)
├── 경기 상세 → 참여 신청
└── 경기 개설 폼 (모드 A / 모드 B 선택)
│
공모전 탭
├── 공모전 목록 (분야·마감일 필터)
├── 공모전 상세 → 팀 합류 신청
└── 북마크 목록
│
스터디 탭
├── 스터디 목록 (분야·일정 필터)
├── 스터디 상세 → 신청
└── 스터디 개설 폼
│
마이페이지
├── 내 신청·개설 현황
├── 알림 목록 (Realtime 뱃지)
└── 프로필 수정
```

---

## 12. 매칭 성사 조건 정리

| 활동 | 성사 조건 | 성사 후 처리 |
|------|----------|------------|
| 스포츠 (학과 대항전) | 양 팀 모두 min_players 도달 | status → matched, Edge Function이 알림 삽입, Realtime 반영 |
| 스포츠 (개인 매칭) | 전체 min_players 도달 (자동) 또는 개설자 수동 확정 | 동일 |
| 공모전 | 최소 팀원 수 + 역할 구성 조건 충족 | team_id 부여, 팀원 이메일 공개, 알림 |
| 스터디 | accepted 인원 ≥ min_members 후 개설자 확정 | status → active, 참여자 알림 |

---

## 13. 개발 우선순위

### Phase 1 — MVP
- [ ] Supabase 프로젝트 생성, 테이블 스키마 및 RLS 설정
- [ ] GitHub 레포 생성 + Vercel 연동
- [ ] Supabase Auth 기반 회원가입·로그인
- [ ] 스포츠 경기 개설 (모드 A/B) 및 참여 신청
- [ ] 공모전 목록 조회 (Supabase contests 테이블)
- [ ] 스터디 개설 및 참여 신청
- [ ] 기본 매칭 성사 로직 (Edge Function)

### Phase 2 — 고도화
- [ ] Supabase Realtime 인원 현황 실시간 반영
- [ ] 공모전 역할 기반 팀 구성 자동 매칭
- [ ] 알림 시스템 (notifications 테이블 + Realtime)
- [ ] 마이페이지 활동 현황

### Phase 3 — 확장
- [ ] 추천 알고리즘 (관심 태그 기반)
- [ ] 관리자 대시보드 (신고 처리, 공모전 등록)
- [ ] 활동 이력 및 평가 시스템

---

## 14. 오픈 이슈 / 결정 필요 사항

| # | 이슈 | 상태 |
|---|------|------|
| 1 | 공모전 역할 구성 조건: 공모전별 커스텀 설정 vs 고정 템플릿 | 미결 |
| 2 | 스포츠 개인 매칭의 자동 성사 vs 개설자 수동 확정 기본값 | 미결 |
| 3 | 매칭 성사 후 팀 소통 수단: 이메일 공개 vs 인앱 채팅 직접 구현 | 미결 |
| 4 | 경기 개설 시 부적절 게시물 신고 처리 프로세스 설계 필요 | 미결 |
| 5 | Supabase 무료 티어 한계(500MB DB, 50MB Storage) → 초과 시 Pro 전환 시점 | 미결 |
