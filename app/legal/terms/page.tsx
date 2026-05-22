export const metadata = { title: "이용약관 - 맛집 기록장" };

export default function TermsPage() {
  return (
    <article className="prose-eatlog">
      <h1 className="text-[28px] font-extrabold mt-2 mb-1" style={{ letterSpacing: "-0.6px" }}>
        이용약관
      </h1>
      <p className="text-[12px] mb-6" style={{ color: "var(--text-2)" }}>
        시행일: 2026년 5월 17일
      </p>

      <Section title="제1조 (목적)">
        본 약관은 맛집 기록장(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여
        서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
      </Section>

      <Section title="제2조 (서비스 내용)">
        <p>서비스는 다음 기능을 제공합니다:</p>
        <ul>
          <li>개인 맛집 정보(이름·위치·평점·메모·사진) 기록 및 조회</li>
          <li>방문 기록 관리</li>
          <li>지도 기반 위치 표시 (Kakao Maps)</li>
          <li>AI 기반 추천, 인사이트, 메뉴 검색 (Google Gemini)</li>
          <li>맛집 정보의 개인 공유 (공개 URL)</li>
        </ul>
      </Section>

      <Section title="제3조 (계정)">
        <ul>
          <li>이메일과 비밀번호로 가입합니다.</li>
          <li>본인 계정 정보 관리 책임은 이용자에게 있습니다.</li>
          <li>회원 탈퇴는 프로필 화면에서 직접 진행할 수 있고, 탈퇴 시 모든 데이터가 즉시 삭제됩니다.</li>
        </ul>
      </Section>

      <Section title="제4조 (이용자의 의무)">
        <ul>
          <li>타인 명예를 훼손하거나 불법 정보를 등록하지 않아야 합니다.</li>
          <li>다른 사람의 저작권을 침해하는 사진·텍스트를 등록하지 않아야 합니다.</li>
          <li>자동화된 방법으로 비정상적인 트래픽을 발생시키지 않아야 합니다.</li>
        </ul>
      </Section>

      <Section title="제5조 (서비스의 변경 및 중단)">
        서비스는 운영상·기술상 필요에 따라 일부 기능을 변경하거나 중단할 수 있습니다.
        중요한 변경 사항은 사전 또는 사후 고지합니다.
      </Section>

      <Section title="제6조 (책임의 제한)">
        <ul>
          <li>서비스는 무료로 제공되며 베타 단계에서는 데이터 손실 가능성이 있습니다.</li>
          <li>AI 추천·메뉴 검색 결과는 부정확할 수 있고, 최종 판단은 이용자에게 있습니다.</li>
          <li>천재지변, 외부 API(Google·Kakao) 장애로 인한 서비스 중단에 대해 책임지지 않습니다.</li>
        </ul>
      </Section>

      <Section title="제7조 (외부 서비스)">
        서비스는 다음 외부 API를 사용합니다:
        <ul>
          <li>Kakao Maps · Kakao Local API (지도·장소 검색)</li>
          <li>Google Gemini API (AI 추천·분석)</li>
          <li>Supabase / GoTrue (인증·데이터베이스)</li>
        </ul>
        각 서비스의 약관도 함께 적용됩니다.
      </Section>

      <Section title="제8조 (분쟁 해결)">
        본 약관에 명시되지 않은 사항은 대한민국 법령 및 일반 상관례에 따릅니다.
        분쟁 발생 시 이용자의 주소지 관할 법원을 합의관할로 합니다.
      </Section>

      <Section title="제9조 (약관의 변경)">
        본 약관은 변경될 수 있으며, 변경 시 시행일 7일 전 서비스 내 공지합니다.
        변경된 약관에 동의하지 않으면 회원 탈퇴할 수 있습니다.
      </Section>

      <p className="text-[12px] mt-8" style={{ color: "var(--text-2)" }}>
        문의: 프로필 → 오류 신고
      </p>
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
