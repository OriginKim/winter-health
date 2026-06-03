# 🐱 겨울이 건강 수첩

> 고양이 겨울이의 식사·음수·몸무게를 가족이 함께 기록하는 비공개 웹 건강 일지

**배포 URL**: https://winter-health.vercel.app

---

## 📌 소개

고양이 겨울이가 당뇨 진단을 받은 후, 매일의 식사량·음수량·몸무게를 가족 모두가 쉽게 기록하고 확인할 수 있도록 만든 가족 전용 웹앱입니다.

Google 로그인(Supabase Auth)으로 접근하며, 허용된 가족 계정만 사용할 수 있습니다.

---

## 📱 주요 기능

### 오늘 기록 (`/`)
- 아침 / 저녁 / 정수기 탭으로 분리된 입력 폼
- 몸무게, 급여량, 준 물, 남은 물 입력 → 음수량 자동 계산
- 총 식사량 / 총 음수량 요약 카드
- 날짜 변경, 기록 삭제, 최근 입력자 표시
- 저장 성공/실패 피드백

### 주간 (`/weekly`)
- 최근 7일 평균 몸무게 / 식사량 / 음수량
- 몸무게 라인 차트, 식사량·음수량 막대 차트
- 날짜별 기록 카드 (기록 없는 날 표시)

### 월간 (`/monthly`)
- 월별 달력 (기록 있는 날 초록 점, 기록 없는 날 회색 점)
- 평균 몸무게 / 식사량 / 음수량
- 날짜 클릭 시 상세 기록 보기
- 이달 몸무게 추이 그래프

---

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | React 19, TypeScript, Vite 8, React Router 7 |
| 스타일 | Tailwind CSS 4, Pretendard (CDN), 인라인 스타일 |
| 차트 | Recharts |
| Backend / DB | Supabase (Auth, PostgreSQL, RLS) |
| 인증 | Google OAuth |
| 배포 | Vercel (GitHub 연동 자동 배포) |

---

## 🗄 데이터베이스 스키마

### profiles

```sql
create table profiles (
  id uuid references auth.users primary key,
  name text,
  created_at timestamptz default now()
);

grant select, insert, update on profiles to anon;
grant select, insert, update on profiles to authenticated;
```

### health_records

```sql
create table health_records (
  id uuid default gen_random_uuid() primary key,
  recorded_by uuid references profiles(id) on delete set null,
  date date not null unique,
  weight numeric(4,2),
  morning_food numeric(5,1),
  morning_water_given numeric(6,1),
  morning_water_left numeric(6,1),
  evening_food numeric(5,1),
  evening_water_given numeric(6,1),
  evening_water_left numeric(6,1),
  purifier_water_given numeric(6,1),
  purifier_water_left numeric(6,1),
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

grant select, insert, update, delete on health_records to anon;
grant select, insert, update, delete on health_records to authenticated;
```

### RLS 정책

```sql
create policy "select_policy" on health_records for select using (true);
create policy "insert_policy" on health_records for insert with check (true);
create policy "update_policy" on health_records for update using (true);
create policy "delete_policy" on health_records for delete using (true);

create policy "profiles_select" on profiles for select using (true);
create policy "profiles_all" on profiles for all using (true);
```

### 이메일 화이트리스트 (가족 계정만 허용)

```sql
create or replace function public.check_allowed_email()
returns trigger as $$
begin
  if new.email not in (
    'your-email@gmail.com',
    'family-email@gmail.com'
  ) then
    raise exception 'unauthorized email';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger check_email_on_signup
  before insert on auth.users
  for each row execute procedure public.check_allowed_email();
```

---

## 🚀 로컬 실행

### 요구 사항

- Node.js 18+
- npm
- Supabase 프로젝트

### 설치 및 실행

```bash
git clone https://github.com/OriginKim/winter-health.git
cd winter-health
npm install
```

`.env` 파일 생성:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

```bash
npm run dev
```

### 정적 자산

`public/` 폴더에 아래 이미지를 직접 추가해야 합니다:

- `geouli-main.jpg` — 로그인 화면용
- `geouli-icon.jpg` — 헤더 아이콘용

---

## ⚙️ 배포 (Vercel)

1. GitHub 레포를 Vercel에 연결
2. Vercel 환경 변수에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` 설정
3. Supabase **Authentication → URL Configuration**에 배포 도메인 등록
4. Google Cloud Console OAuth 클라이언트에 리다이렉트 URI 추가
5. `main` 브랜치에 push하면 자동 배포

---

## 📁 프로젝트 구조

```
winter-health/
├── public/
│   ├── geouli-main.jpg
│   └── geouli-icon.jpg
├── src/
│   ├── App.tsx
│   ├── lib/supabase.ts
│   ├── types.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── SetNamePage.tsx
│   │   ├── TodayPage.tsx
│   │   ├── WeeklyPage.tsx
│   │   └── MonthlyPage.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── vite.config.ts
└── package.json
```

---

## 📜 npm 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | TypeScript 검사 + 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint |

---

## 🔒 보안

- Google OAuth + Supabase Auth 기반 인증
- DB 트리거로 허용된 이메일만 가입 가능
- Supabase RLS(Row Level Security) 적용
- 환경 변수로 API 키 관리 (`.env` git 미포함)

---

*겨울이가 건강하게 오래오래 살기를 🐱*