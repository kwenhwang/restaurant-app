# eatlog — 코드베이스 가이드 (Claude/AGENTS용)

> 한국 맛집 기록 PWA. 사이드 프로젝트, self-hosted, Next.js 16. 본 문서는
> 새 기여자(미래의 나 포함)가 5분에 핵심을 파악하도록 구성.

@AGENTS.md

---

## 1. 운영 개관

- **URL**: https://eatlog.duckdns.org
- **인프라**: 집 서버(`10.0.1.14`) systemd `restaurant-app.service` — Next.js
  + nginx reverse-proxy. Supabase 자체호스팅(`sword33.duckdns.org`) + MinIO
  사진 저장. 모두 같은 박스. 인프라 비용 ≈ 0.
- **유일한 변동비**: Gemini API. 헤비 유저 1명 ~ $2–5/월. `place_*` 캐시로
  사용자 간 amortize.
- **배포**: GitHub push → 집서버 `git pull && pnpm build && systemctl
  restart restaurant-app`. GHA가 E2E + 단위 테스트.
- **사이드 프로젝트 페이스**: 주말 단위. 결제는 사용자 100명 모인 뒤 켜기로
  보류 중.

---

## 2. 디렉토리 지도

| 경로 | 설명 |
|---|---|
| `app/(main)/*` | 인증 필요 라우트 (proxy.ts가 강제). 홈·식당·컬렉션·프로필 등. |
| `app/c/[token]` `app/r/[token]` `app/place/[name]` | 공개(비로그인) 라우트. proxy.ts isPublicPage 예외. |
| `app/api/ai/*` | Gemini 9 라우트. 모두 `createAIRoute` 헬퍼 통과. |
| `app/api/kakao/*` | Kakao Local API 프록시. **반드시 auth + rate limit**. |
| `app/api/{feedback,follow,billing,import,collections,upload}` | 기타 API. |
| `components/` | 도메인별 분류 (restaurants/, home/, capture/, social/, ranking/, billing/, feedback/, ui/, profile/). |
| `lib/` | 순수 함수 + 인프라 헬퍼. 단위 테스트 대상은 여기. |
| `lib/supabase/{server,client,admin}.ts` | 세 종류 클라이언트. admin = service role. |
| `lib/ai/gemini.ts` | REST direct, no SDK. `generateJSON` / `generateGroundedJSON` / `generateJSONWithImage` / `generateText`. |
| `lib/ai/handler.ts` | `createAIRoute({ rateKey, perMinute, perDay, parseBody, handler })`. **모든 신규 AI 라우트는 이걸로 작성**. |
| `lib/place-cache.ts` | `normalizeName`, `bucketCoord`, `readPlaceCache`, `writePlaceCache`. shared cache 패턴. |
| `lib/rate-limit.ts` | In-memory per-user 카운터. `checkRateLimit`. |
| `lib/premium.ts` | `isPremium`, `getPremiumStatus`, `requirePremiumOrThrow`. 결제 게이트용. |
| `supabase/migrations/*` | 시간순. 라이브에 적용은 `ssh ubuntu@10.0.1.14 "docker exec -i supabase-db psql -U postgres postgres" < file.sql`. |
| `tests/e2e/*` | Playwright. 14 spec. 라이브에 직접 테스트. |
| `tests/unit/*` | vitest. lib/ 순수 함수 회귀. |

---

## 3. 코딩 패턴 (반드시 따를 것)

### 3.1 폼 + Server Action

`<form action={serverAction}>` 패턴은 **금지**. React RSC가 필드명을 `_1_note`로 prefix해서 `formData.get("note")`가 빈 값이 되는 버그(`2825629` 커밋 참조). 대신:

```tsx
"use client";
const fd = new FormData(formEl.current);  // 또는 manual append
const result = await action(fd);
if ("error" in result) setError(result.error);
else router.push(`/.../${result.id}`);
```

서버 액션은 `redirect()` 대신 `{ id }` 또는 `{ error }` 반환. `redirect()`는 `startTransition` 안에서 삼켜짐.

레퍼런스: `components/collections/CollectionForm.tsx`, `components/restaurants/RestaurantForm.tsx`.

### 3.2 AI 라우트

새 AI endpoint는 `createAIRoute`로:

```ts
export const POST = createAIRoute<TBody, TResult>({
  rateKey: "ai-foo",
  perMinute: 5,
  perDay: 50,
  parseBody: (raw) => { /* throw AIBadRequest if invalid */ },
  handler: async ({ supabase, user, body }) => {
    // your business logic
    return result; // 또는 NextResponse.json(...)
  },
});
```

- auth + rate limit + quota detection은 자동.
- handler가 throw하면 generic AI 오류 응답.
- 캐시 쓰기 같은 부수효과는 handler에서 NextResponse 직접 반환.

### 3.3 Shared place cache

`place_menus` / `place_reviews`는 cross-user. service role로 쓰기. 키는
(normalize된 이름, lat/lng bucket). 변경 안 함:

```ts
const cache = await readPlaceCache({ admin, table: "place_menus", name, lat, lng, okTtlMs, negTtlMs });
if (cache.fresh && cache.status === "ok") { /* hit */ }
// ... AI call ...
await writePlaceCache({ admin, table, name, displayName, lat, lng, status: "ok", payload });
```

### 3.4 RLS + GRANT 체크리스트

신규 테이블 만들 때 반드시:
1. `alter table ... enable row level security;`
2. owner-scoped policies (select/insert/update/delete)
3. `grant select, insert, update, delete on ... to authenticated;` ← **잊지 말 것**. RLS만 추가하고 GRANT 빼먹으면 "permission denied" (commit `4602186` 참조).
4. service role엔 `grant all`.

### 3.5 비밀 정보

- 절대 git에 commit 안 함. `.env.local` gitignored.
- `KAKAO_REST_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 등 서버 전용.
- 클라이언트는 `NEXT_PUBLIC_*`만.

---

## 4. 데이터 모델 요점

- **user-private**: `restaurants`, `visits`, `restaurant_images`, `restaurant_tags`, `bug_reports`, `collections`, `collection_items`, `user_feedback`, `user_follows`, `restaurant_comparisons`, `restaurant_scores`, `subscriptions`. 모두 RLS.
- **shared cross-user**: `place_menus`, `place_reviews`. 익명 SELECT 허용.
- **공개 share**: `restaurants.share_token` → `/r/<token>`, `collections.share_token` → `/c/<token>`. service role로 lookup.
- **랭킹**: legacy `restaurants.rating` 유지 (호환). 실제 랭킹은 `restaurant_scores.elo` (Beli-style pairwise) + `lib/rankings.ts:rankAllByElo`.

---

## 5. 수익화 상태

- 코드 골격은 깔려 있음: `subscriptions` 테이블 + `/billing/upgrade` + `/profile/billing` + `lib/premium.ts`.
- 결제 통합(KakaoPay)은 **사용자 100명 후** 켜기로 보류.
- Premium 게이트 (AI 라우트 perDay 차등) 는 결제 라이브 후 켜기.
- SEO 페이지(`/place/[name]`) + OG 이미지 3종 + sitemap.xml + Naver/Google
  봇 명시 허용으로 organic 유입 채널 확보.
- 친구 follow + 홈 활동 피드(`FriendCollectionsSection`)로 retention layer.
- 월간 미식 리포트(`/profile/reports/[yyyymm]`)로 매월 재방문 hook.

---

## 6. 개발 명령

```bash
pnpm dev              # localhost:3000
pnpm build            # production build
pnpm test             # vitest 단위 테스트
pnpm test:e2e         # Playwright (라이브 eatlog 대상)
pnpm test:e2e:headed  # 브라우저 보면서
```

마이그레이션 적용 (로컬 dev DB 없음 — 라이브로 직접):

```bash
ssh ubuntu@10.0.1.14 "docker exec -i supabase-db psql -U postgres postgres" \
  < supabase/migrations/20260623_xxx.sql
ssh ubuntu@10.0.1.14 "docker exec supabase-db psql -U postgres -d postgres \
  -c \"NOTIFY pgrst, 'reload schema';\" && docker restart supabase-rest"
```

배포:

```bash
git push origin main
ssh ubuntu@10.0.1.14 "cd ~/restaurant-app && git pull && pnpm build && sudo systemctl restart restaurant-app"
```

---

## 7. 자주 부딪히는 함정

- **Korean text in JSON tools**: `\uXXXX` escape 직접 만들지 말 것. 그냥 한글 입력 (도구가 알아서 처리).
- **Service Worker controllerchange**: SW가 새 controller 잡으면 자동 reload. Playwright는 `serviceWorkers: "block"` 필수.
- **redirect() 안 됨**: server action에서 `redirect()`가 client `startTransition` 안에선 삼켜짐. id 반환 + client router.push로.
- **PostgREST 캐시**: 마이그레이션 후 `NOTIFY pgrst, 'reload schema'` + `docker restart supabase-rest` 안 하면 새 컬럼 안 보임.
- **quota 에러 캐시 금지**: Gemini quota 에러는 transient. error 캐시에 굳이지 말 것 — handler.ts의 try/catch가 자동 처리.

---

## 8. 메모리 + plan 파일

- `/home/ubuntu/.claude/projects/-home-ubuntu-simple-restaurant-app/memory/` — 장기 프로젝트 컨텍스트.
- `/home/ubuntu/.claude/plans/noble-snuggling-candy.md` — 진행 중 plan.

자세한 도메인 컨텍스트(과거 의사결정·실패·핫픽스)는 메모리에 있음. 새 세션 시작 시 메모리 자동 로드됨.
