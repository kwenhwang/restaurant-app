export const metadata = { title: "개인정보처리방침 - 맛집 기록장" };

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="text-[28px] font-extrabold mt-2 mb-1" style={{ letterSpacing: "-0.6px" }}>
        개인정보처리방침
      </h1>
      <p className="text-[12px] mb-6" style={{ color: "var(--text-2)" }}>
        시행일: 2026년 5월 17일
      </p>

      <Section title="1. 개인정보 수집 항목 및 목적">
        <table className="text-[13px] w-full mt-1">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--separator)" }}>
              <th className="text-left py-1.5">항목</th>
              <th className="text-left py-1.5">목적</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["이메일·암호화된 비밀번호", "회원 식별, 로그인"],
              ["맛집 이름·주소·좌표·평점·메모", "기록 및 표시"],
              ["방문 기록(날짜·메모)", "방문 이력 관리"],
              ["사진(맛집·메뉴판)", "사용자 본인이 등록한 시각 정보 저장"],
              ["기기 위치 (선택)", "주변 맛집 추천, 지도 표시"],
              ["디바이스 정보·접속 URL (오류 신고 시)", "버그 분석"],
            ].map(([k, v]) => (
              <tr key={k} style={{ borderBottom: "1px solid var(--separator)" }}>
                <td className="py-1.5">{k}</td>
                <td className="py-1.5">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="2. 보유 및 이용 기간">
        <ul>
          <li>회원 정보·맛집·방문·사진: 회원 탈퇴 시까지</li>
          <li>오류 신고(bug_reports): 처리 완료 후 6개월 보관 후 파기</li>
          <li>전역 메뉴 캐시(place_menus): 익명화된 가게 이름·좌표·메뉴만 저장, 사용자 식별 정보 없음. 30일마다 재검증</li>
        </ul>
      </Section>

      <Section title="3. 위치정보 처리">
        <p>
          맛집 등록 시 GPS 위치를 사용합니다. 사용자가 명시적으로 동의한 경우에만 수집하며,
          좌표는 해당 맛집 기록에만 사용되고 별도 위치 이력으로 보관하지 않습니다.
          브라우저 설정에서 언제든지 권한을 회수할 수 있습니다.
        </p>
      </Section>

      <Section title="4. 제3자 위탁 (개인정보 처리 위탁)">
        <table className="text-[13px] w-full mt-1">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--separator)" }}>
              <th className="text-left py-1.5">위탁자</th>
              <th className="text-left py-1.5">위탁 업무</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Google LLC (Gemini)", "사진·텍스트·검색어 분석 (메뉴 추출, 추천, 인사이트)"],
              ["Kakao Corp.", "지도·장소 검색·주소→좌표 변환"],
              ["자체 호스팅 서버 (MinIO, Supabase)", "이미지 저장, 데이터베이스"],
            ].map(([k, v]) => (
              <tr key={k} style={{ borderBottom: "1px solid var(--separator)" }}>
                <td className="py-1.5">{k}</td>
                <td className="py-1.5">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="5. 정보주체의 권리">
        이용자는 언제든지 다음 권리를 행사할 수 있습니다:
        <ul>
          <li>개인정보 열람·정정·삭제: 프로필 화면에서 직접</li>
          <li>회원 탈퇴 (전체 데이터 삭제): 프로필 → 계정 삭제</li>
          <li>위치정보 동의 철회: 브라우저 권한 설정</li>
          <li>처리 정지 요청: 오류 신고를 통해</li>
        </ul>
      </Section>

      <Section title="6. 파기 절차 및 방법">
        회원 탈퇴 시 다음 데이터가 즉시 삭제됩니다:
        <ul>
          <li>계정·이메일</li>
          <li>등록한 모든 맛집·방문 기록</li>
          <li>업로드한 모든 사진 (MinIO에서도 영구 삭제)</li>
          <li>오류 신고 (본인이 작성한 것)</li>
        </ul>
      </Section>

      <Section title="7. 안전성 확보 조치">
        <ul>
          <li>비밀번호는 단방향 해시(bcrypt)로 저장</li>
          <li>HTTPS 통신 강제 (HSTS)</li>
          <li>Row Level Security로 본인 데이터만 접근 가능</li>
          <li>일일 데이터베이스 자동 백업 (7일 보관)</li>
        </ul>
      </Section>

      <Section title="8. 쿠키·로컬 저장소">
        서비스는 다음 목적으로 쿠키·로컬 저장소를 사용합니다:
        <ul>
          <li>로그인 세션 유지 (필수)</li>
          <li>테마 설정·위치 동의 여부 (기능 개선)</li>
          <li>AI 추천 결과 캐싱 (성능)</li>
        </ul>
        분석·광고 추적은 사용하지 않습니다.
      </Section>

      <Section title="9. 개인정보 보호책임자 및 문의">
        문의 채널: 프로필 → 오류 신고
      </Section>

      <Section title="10. 변경 사항">
        본 방침은 변경될 수 있으며, 변경 시 시행일 7일 전 서비스 내 공지합니다.
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[17px] font-bold mb-2">{title}</h2>
      <div className="text-[14px] leading-relaxed space-y-2" style={{ color: "var(--text)" }}>
        {children}
      </div>
    </section>
  );
}
