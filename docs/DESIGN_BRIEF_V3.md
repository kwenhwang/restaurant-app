# 맛집 기록장 — 디자인 의뢰서 v3

> **For Claude Designer**  
> 저장소: https://github.com/kwenhwang/restaurant-app · `main` 브랜치  
> 라이브: https://eatlog.duckdns.org  
> 작성일: 2026-05-22

---

## 0. 한 줄 요약

지난 두 차례(rest.zip, rest v2.zip) 의뢰를 통해 **기능 채우기와 정보 추가**는 끝났습니다. v3에서는 **첫 인상과 시각적 차별성**을 만들고 싶습니다. 기능 추가가 아니라 **레이아웃·컬러·타이포·인터랙션**을 다시 짜는 작업입니다.

## 1. 현재 상태 (v2 적용 후)

### 디자인 시스템 (유지할 베이스)
- **컬러 토큰** — `--accent: #FF6F3D` (orange), `--bg`, `--text/text-2/text-3`, `--separator`, `--surface`
- **타이포** — Apple SD Gothic Neo / Pretendard fallback
- **레이아웃** — `rounded-2xl` 카드, inset-grouped 그룹, large title 헤더
- **네비** — 하단 TabBar (맛집/지도/기록/프로필) + 가운데 + 등록 버튼
- **다크모드** — `html[data-theme="dark"]` 토큰 매핑됨

### v2에서 추가된 기능 컴포넌트 (계속 활용)
- `components/restaurants/RankBadge.tsx` — 순위 뱃지
- `components/restaurants/RankPanel.tsx` — 순위 패널
- `components/restaurants/TagList.tsx` / `TagPicker.tsx` — 태그
- `components/restaurants/PlaceInfoGroup.tsx` — 영업시간·전화·주소
- `components/onboarding/OnboardingTour.tsx` — 신규 사용자
- `components/home/AIRecommend.tsx` — AI 추천 카드
- `lib/category-icons.ts` — 카테고리별 이모지+그라데이션

---

## 2. v3 의뢰 항목 (10개)

### A. 첫 인상 / 홈 페이지

#### A1. 홈 카드 레이아웃 재설계 ⭐
- 현재: 작은 72×72 썸네일 + 텍스트 가로 카드 (`components/restaurants/RestaurantCard.tsx`)
- 목표: **사진을 더 크게** (4:3 또는 1:1, 카드 전체의 60%+)
- 점수·방문 회수·즐겨찾기를 사진 위 **오버레이**로 (Beli/Tabelog 스타일)
- 빈 사진은 카테고리 이모지 + 그라데이션 그대로 유지

#### A2. 홈 헤더 — Hero AI 추천
- 현재: "내 맛집" 단순 텍스트 → 그 아래 AI 추천 카드 (`AIRecommend.tsx`)
- 목표: AI 추천을 **헤더 영역으로 끌어올림**. 첫 화면 1/3 차지하는 hero
- "오늘의 추천", 가게 사진/메뉴 미리보기, 시간대 인사
- 추천 카드 가로 스와이프 (1~3개)

#### A3. 카드 그룹화
- 단일 리스트 → 섹션화: 
  - 🔥 자주 가는 곳 (visit_count 상위 3)
  - 💛 즐겨찾기
  - 🆕 최근 추가
  - 📍 가까운 가게 (GPS 있을 때)
- 각 섹션 가로 스크롤 또는 컴팩트 리스트

### B. 컬러 시스템 확장

#### B1. 메인 + 보조 컬러
- 현재: orange `#FF6F3D` 단색 모든 곳
- 목표: 메인 + 보조 2개 (예: orange + 청록 / 보라 / 노랑)
- 보조는 secondary 액션 (저장, 공유 등)에 사용
- 평점별/카테고리별 hint 컬러도 제안

#### B2. 카테고리 컬러
- 현재: 카테고리 이모지 (`lib/category-icons.ts`) — 그라데이션은 있지만 약함
- 목표: 8개 카테고리별 더 명확한 톤·색깔
- 카드 보더, 뱃지, 칩에 일관 사용

### C. 타이포 / 여백

#### C1. 헤딩 스케일 강화
- 현재: 28px Large Title — 깔끔하지만 평이
- 목표: 더 임팩트 있는 헤딩 (예: 36px+ display 폰트)
- 가게명, 섹션 헤더의 위계 명확화

#### C2. 여백·구도 매거진화
- 현재: 균일한 패딩 (`px-4`, `pt-5`)
- 목표: 의도적 비대칭, 큰 여백, 시선 흐름 유도
- "에디토리얼" 느낌 도입

### D. 상세 페이지

#### D1. Hero 재구성 ⭐
- 현재: 300px 사진 + 헤더 카드 (이름·평점·즐겨찾기)
- 목표: 사진을 더 크게(60vh?), 사진 위에 **점수 카드 오버레이** + 가게명 큰 타이포
- "매거진 표지" 느낌
- 스크롤 시 헤더 stick

#### D2. 정보 위계 정리
- 현재: 사진 → 헤더 → QuickAction → 사진섹션 → 메뉴 → 가게정보 → 순위 → 메모 → 방문
- 목표: 같은 정보지만 **중요도 위계** 명확. 본문에 강약. 
- 메뉴와 가격대 시각적으로 강조

### E. 마이크로 인터랙션

#### E1. 카드 탭 피드백
- 현재: `active:scale-[0.99]` 약함
- 목표: 더 분명한 press feedback, 즐겨찾기 ♥ 탭 시 lottie/spring 애니메이션

#### E2. Skeleton loading 일관성
- 현재: `app/(main)/loading.tsx`만 있음
- 목표: 카드/상세/리스트 모두 일관된 skeleton 디자인

### F. 페이지별 마감

#### F1. 로그인 페이지 (현재 / app/(auth)/login/page.tsx)
- 현재: 아이콘 박스 + Google 버튼 + 약관 링크 (단순)
- 목표: 첫 인상 강화 — 배경 일러스트 또는 그라데이션, 환영 카피, 1+ 브랜드 요소

#### F2. 빈 상태 (모든 페이지)
- 홈 빈 상태는 OnboardingTour 있음
- 지도, 방문 기록, 프로필 등 다른 페이지 빈 상태도 통일된 일러스트

#### F3. 공유 페이지 `/r/[token]`
- 현재: 본문과 유사한 디자인
- 목표: 외부 노출용. "이 가게 어때?" 친구에게 공유받았을 때 임팩트 있게.

---

## 3. 건들지 말 부분 (Backend / Logic)

다음은 **수정 금지** — 디자인만 바꿔주세요:

- `app/api/**` — 모든 API 라우트 (AI, 업로드, Kakao 등)
- `lib/ai/**` — Gemini 통합
- `lib/supabase/**` — Supabase 클라이언트
- `proxy.ts` — 인증 미들웨어
- `next.config.ts` — 보안 헤더 (CSP에 새 외부 도메인 필요하면 알려주세요)
- `supabase/migrations/**` — DB 스키마
- `app/(main)/profile/account-action.ts` — 회원 탈퇴 로직
- 인증 흐름: `/login`, `/auth/callback`, `/signup` (Google OAuth 전용)
- Server Actions (파일에 `"use server"` 있는 것)
- Sentry 통합 (`sentry.*.config.ts`, `instrumentation.ts`)

---

## 4. 데이터 모델 참조

`lib/types.ts` 의 `Restaurant`, `Visit`, `Tag`, `BusinessHours` 그대로. v3에서 추가 필드 필요하면 의뢰서에 명시해 주세요.

**가게 1개당 표시 가능한 정보:**
- 기본: 이름·주소·평점·카테고리·메모·즐겨찾기 여부
- v2 추가: 방문 회수, 마지막 방문일, 태그(다중), 전화, 영업시간, place_url, 순위
- 사진: 다중 (대표 1장 + 추가)
- 메뉴: items[] + price_range + summary (AI 추출)

---

## 5. 결과 전달 방식

### 방식 (우선순위)
1. **GitHub PR 권장** — fork 후 `design/v3` 브랜치로 PR
2. zip — 지난번처럼 `nextjs-patch-v3/` 폴더 구조로 압축
3. Figma 디자인만 — 별도 협의

### 변경 파일 범위
- `components/**` — UI 컴포넌트 (가장 많이)
- `app/**/page.tsx` — 페이지 레이아웃
- `app/globals.css` — 토큰·전역 스타일
- `lib/category-icons.ts` — 카테고리 컬러 확장
- 신규 컴포넌트 자유롭게 추가
- `lib/types.ts` — 필드 추가 필요 시

### 커밋 메시지 양식 (zip이면 README에 동일)
- `feat(ux-v3): <변경 영역> <한 줄 요약>`
- 예: `feat(ux-v3): 홈 카드 레이아웃 정사각 사진 + 점수 오버레이`

---

## 6. 검증 시나리오 (작업 완료 후 디자이너가 확인)

- [ ] 신규 가입자(맛집 0개)가 홈에 들어왔을 때 — 환영하는 느낌
- [ ] 가입자가 맛집 5개 등록 후 홈 — 차별적 카드 + 섹션 그룹
- [ ] 상세 페이지 진입 — hero 인상적, 메뉴/가격대 한눈에
- [ ] 로그인 페이지 — 첫 방문자에게 신뢰감
- [ ] 다크 모드 토글 — 모든 새 요소가 토큰 색상 사용
- [ ] 즐겨찾기 ♥ 탭 — 피드백 명확
- [ ] 모바일 360px 폭에서도 깔끔
- [ ] 데스크탑 ~768px에서도 망가지지 않음

---

## 7. 참고 자료

- **Beli** (NYC 맛집 앱) — 점수 카드 오버레이, 친구 비교
- **Tabelog** (일본) — 매거진 느낌, 큰 사진
- **카카오맵·네이버 플레이스** — 한국 사용자 익숙
- **Apple Health / Notes** — 정보 위계 정리

---

## 8. 톤 / 톤 / 톤

- 한국어 UI 유지
- **친근하지만 진지**한 디자인 (장난스럽지 않게)
- 사진 콘텐츠가 주인공 — UI는 사진을 살림
- "내 사적인 미식 일지" 느낌 (인스타그램 그리드 ≠, 더 차분)

---

질문 있으시면 PR description 또는 README에 적어주세요. 작업 흐름 / 디자인 방향이 명확하지 않은 부분 있으면 의견 환영합니다.
