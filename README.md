# 맛집 기록장 — UX v3 패치 (`nextjs-patch-v3`)

> 디자인 의뢰서 v3 대응. **레이아웃·컬러·타이포·인터랙션 전면 리디자인.**
> 백엔드/로직(`app/api`, `lib/ai`, `lib/supabase`, `proxy.ts`, server actions, 인증 흐름, DB)은 **일절 수정하지 않았습니다.**

미리보기(인터랙티브 프로토타입): 전 화면·다크모드·카드 레이아웃 변형을 `eatlog v3.html` 한 파일에서 확인할 수 있습니다(별도 첨부).

---

## 1. 적용 방법

이 폴더(`nextjs-patch-v3/`)의 내부 구조는 **저장소 루트와 동일**합니다. 폴더 안의 파일을 저장소 같은 경로에 덮어쓰면 됩니다.

```bash
# 저장소 루트에서
cp -R nextjs-patch-v3/* .
```

`design/v3` 브랜치 기준입니다. 새로운 npm 패키지는 없습니다(폰트는 CSS `@import`로 로드).

### ✅ 폰트 — 셀프호스팅 (CSP 변경 불필요)
v3는 `next/font`로 폰트를 **빌드 타임에 셀프호스팅**합니다. 외부 `@import`가 없으므로 **CSP를 건드릴 필요가 없습니다.**

- `app/fonts.ts` — Pretendard(local) + Noto Serif KR(`next/font/google`)를 로드하고 `--font-pretendard` / `--font-noto-serif-kr` CSS 변수를 `<html>`에 주입
- `app/layout.tsx` — 두 변수 클래스를 `<html>`에 적용
- `app/globals.css` — `--font-sans` / `--font-display`가 위 변수를 우선 사용(폴백 체인 포함)

**📌 한 가지 준비물:** Pretendard는 Google Fonts에 없어 로컬 파일이 필요합니다.
[Pretendard 릴리스](https://github.com/orioncactus/pretendard/releases)에서 `PretendardVariable.woff2`를 받아 **`app/fonts/PretendardVariable.woff2`**에 두세요. (또는 `app/fonts.ts`에서 Pretendard 블록을 지우면 시스템 폰트로 폴백됩니다 — Noto Serif 헤드라인은 그대로 동작.)

`next/image`는 기존 `NEXT_PUBLIC_IMAGE_BASE_URL` 도메인만 사용하므로 이미지 도메인 추가는 불필요합니다.

---

## 2. 변경 파일 & 커밋 메시지

수정(덮어쓰기):

| 파일 | 커밋 메시지 |
|---|---|
| `app/globals.css` | `feat(ux-v3): 듀오 컬러·카테고리 8색·세리프 디스플레이·따뜻한 페이퍼 토큰` |
| `lib/category-icons.ts` | `feat(ux-v3): 카테고리별 컬러 키 + 강화된 그라데이션 (하위호환)` |
| `components/ui/Sym.tsx` | `feat(ux-v3): 아이콘 추가 (sparkle/clock/link/phone/location/moon/sun 등)` |
| `components/ui/LargeTitle.tsx` | `feat(ux-v3): 라지타이틀 세리프 디스플레이 38px` |
| `components/restaurants/RestaurantCard.tsx` | `feat(ux-v3): 홈 카드 큰 사진 + 점수/순위/♥ 오버레이` |
| `components/restaurants/FavoriteButton.tsx` | `feat(ux-v3): ♥ 스프링 팝 + 링 버스트, glass 변형 추가` |
| `components/home/AIRecommend.tsx` | `feat(ux-v3): AI 추천 풀블리드 사진 Hero + 가로 스와이프` |
| `components/home/HomeFilters.tsx` | `feat(ux-v3): 섹션 레일(자주/즐겨찾기) + 사진 카드 피드` |
| `components/onboarding/OnboardingTour.tsx` | `feat(ux-v3): 온보딩 세리프·듀오 컬러 리프레시` |
| `app/layout.tsx` | `feat(ux-v3): 셀프호스팅 폰트 변수 연결 + 스킵 링크 + 핀치줌 허용(a11y)` |
| `app/(main)/layout.tsx` | `feat(ux-v3): main 랜드마크 + 스킵 링크 타깃(#main-content)` |
| `components/ui/TabBar.tsx` | `feat(ux-v3): aria-current/라벨 + safe-area inset` |
| `components/ui/Stars.tsx` | `feat(ux-v3): 별점 스크린리더 라벨(role=img)` |
| `app/(main)/page.tsx` | `feat(ux-v3): 추천 Hero에 사진 전달(이미지 prop)` |
| `app/(main)/restaurants/[id]/page.tsx` | `feat(ux-v3): 상세 매거진 hero(60vh) + 스티키 헤더 + 메뉴 강조` |
| `app/(main)/map/page.tsx` | `feat(ux-v3): 지도 빈 상태 통일(EmptyState)` |
| `app/(main)/visits/page.tsx` | `feat(ux-v3): 방문 기록 토큰화 + 빈 상태 통일` |
| `app/(main)/profile/page.tsx` | `feat(ux-v3): 프로필 신원 카드 + 세리프 섹션 헤더` |
| `components/profile/Stats.tsx` | `feat(ux-v3): 통계 세리프 숫자 + 카테고리 컬러 막대` |
| `app/(auth)/login/page.tsx` | `feat(ux-v3): 로그인 그라데이션 배경 + 브랜드/플레이트 + 가치 카피` |
| `app/r/[token]/page.tsx` | `feat(ux-v3): 공유 페이지 매거진 표지 + 메뉴/가격대 + CTA 강화` |
| `app/(main)/loading.tsx` | `feat(ux-v3): 홈 스켈레톤 일관화` |

신규 파일:

| 파일 | 용도 |
|---|---|
| `app/fonts.ts` | 셀프호스팅 폰트(next/font) — CSP 불필요 |
| `components/restaurants/CategoryPlaceholder.tsx` | 빈 사진 placeholder(접시+글래스 융합, 광원·그레인·유리 디스크) |
| `components/restaurants/RestaurantMiniCard.tsx` | 섹션 레일용 컴팩트 사진 카드 |
| `components/home/HomeSections.tsx` | 🔥자주 가는 곳 · 💛즐겨찾기 레일(A3) |
| `components/restaurants/RestaurantStickyHeader.tsx` | 상세 스크롤 스티키 헤더(D1) |
| `components/ui/EmptyState.tsx` | 통일된 빈 상태 일러스트(F2) |
| `components/restaurants/RestaurantCardSkeleton.tsx` | 카드 스켈레톤(E2) |

## 3a. 접근성 (a11y)

- **핀치 줌 허용** — `viewport`의 `maximumScale` 제거(WCAG 1.4.4). 저시력 사용자 확대 가능
- **스킵 링크** — `app/layout.tsx`에 "본문으로 건너뛰기" → `#main-content`
- **키보드 포커스 링** — `:focus-visible` 전역 링(사진 위 요소는 `.on-photo` 흰색 헤일로)
- **별점 라벨** — `Stars`에 `role="img"` + "5점 만점에 N점"
- **아이콘 버튼 라벨** — 상세 뒤로/공유/길찾기 등 `aria-label`
- **탭바** — 활성 탭 `aria-current="page"` + `aria-label`
- **고대비 모드** — `@media (prefers-contrast: more)`에서 구분선·보조 텍스트 강화
- **모션 축소** — `prefers-reduced-motion`에서 애니메이션 정지(콘텐츠는 항상 보임)
- **safe-area** — 탭바·FAB가 `env(safe-area-inset-bottom)` 반영

---

## 3. 의뢰서 항목 매핑

- **A1 홈 카드** — `RestaurantCard`: 4:3 사진 위 점수·순위·♥ 오버레이, 빈 사진은 `CategoryPlaceholder`(접시+글래스 융합: 카테고리 광원 그라데이션 + 필름 그레인 + 이모지를 반투명 유리 접시에 담음)
- **A2 Hero 추천** — `AIRecommend`: 첫 화면 상단 풀블리드 사진 Hero(시간대 인사 + 1~3개 가로 스와이프). 데이터 페칭/캐시/위치 로직 그대로
- **A3 섹션 그룹** — `HomeSections`(자주 가는 곳·즐겨찾기 레일) + `HomeFilters`의 "전체 기록" 피드. 필터/검색 시 자동으로 결과만 표시
- **B1 듀오 컬러** — 메인 오렌지 `--accent` + 보조 딥그린 `--accent-2`(저장/공유/길찾기 등). `globals.css`
- **B2 카테고리 컬러** — `--c-han … --c-etc` 8색 토큰 + `category-icons.ts`의 `key`. 칩·뱃지·핀에 일관 사용
- **C1 헤딩** — Noto Serif KR 디스플레이(`.font-display`, `--font-display`). 가게명/섹션 헤더
- **C2 여백·구도** — 인덱스 넘버 섹션 헤더 + 비대칭 여백. `--ed`(에디토리얼 강도) 변수로 스케일 조절
- **D1 상세 Hero** — 58vh 매거진 표지 + 점수/순위 오버레이 + 스크롤 스티키 헤더
- **D2 정보 위계** — 메뉴를 1번 섹션으로 끌어올리고 가격대 콜아웃 강조
- **E1 카드 탭/♥** — `FavoriteButton` 스프링 팝 + 링 버스트, 카드/버튼 press
- **E2 스켈레톤** — `.skeleton` 유틸 + `RestaurantCardSkeleton` + `loading.tsx`
- **F1 로그인** — 그라데이션 배경 + 브랜드 마크 + 플로팅 플레이트 + 가치 카피
- **F2 빈 상태** — `EmptyState` 공통화(지도·방문, 그리고 검색)
- **F3 공유** — 매거진 표지 + 메모/메뉴/가격대 + "나도 시작하기" CTA
- **다크 모드** — `html[data-theme="dark"]` + OS 자동. 신규 요소 전부 토큰 기반

## 4. 검증 시나리오(의뢰서 6번)

- [x] 신규 가입자(0개) 홈 — 환영 온보딩(`OnboardingTour`)
- [x] 5개 등록 후 홈 — 차별 카드 + 섹션 그룹
- [x] 상세 진입 — 매거진 hero, 메뉴/가격대 한눈에
- [x] 로그인 — 신뢰감 있는 첫 인상
- [x] 다크 모드 — 모든 신규 요소 토큰 색상
- [x] ♥ 탭 — 스프링+버스트 피드백
- [x] 360px / ~768px — 모바일 우선, `max-w-[640px]` 셸 내 정상

## 5. 참고

- **가까운 가게(GPS)** 레일은 `HomeSections`에 `nearby` prop 자리를 마련해 두었습니다. 위치 권한 기반 정렬 데이터를 넘겨주시면 켜집니다.
- 카테고리 토큰에 v1의 `디저트`도 포함했습니다(데이터에 있으면 자동 사용).
- 폰트를 셀프호스팅하는 버전이 필요하면 말씀해 주세요.
