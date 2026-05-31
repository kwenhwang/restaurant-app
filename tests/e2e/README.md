# E2E Tests

Playwright tests against `https://eatlog.duckdns.org` covering the 5 한국 특화 features.

## 첫 1회 — Google OAuth 인증 (저장된 세션 만들기)

```bash
pnpm test:e2e:auth
```

브라우저가 열려요. Google 계정으로 로그인 → 홈으로 redirect되면 자동 종료.
세션이 `tests/e2e/.auth/user.json`에 저장됩니다 (gitignored).

세션 만료는 약 25일. 만료되면 같은 명령으로 재인증.

## 전체 테스트 실행

```bash
pnpm test:e2e            # 헤드리스
pnpm test:e2e:headed     # 브라우저 보이게
pnpm test:e2e:report     # 마지막 리포트 HTML 보기
```

## 특정 스펙만

```bash
pnpm exec playwright test tests/e2e/collections.spec.ts
pnpm exec playwright test -g "공유 페이지"
```

## 다른 환경 대상

```bash
E2E_BASE_URL=http://localhost:3100 pnpm test:e2e
```

## 데이터 부수효과

- `collections.spec.ts` — 매번 새 컬렉션을 생성·삭제 (clean-up 함).
- 다른 스펙들은 read-only.
- AI 사용 라우트 (find-reviews, discover)는 quota를 아끼려고 클릭만 검증하고
  실제 호출은 하지 않음.

## 디버깅

테스트 실패 시 `playwright-report/` 폴더에 trace + screenshot + video 저장.
`pnpm test:e2e:report`로 열어보면 됩니다.
