/**
 * 앱 설정
 */
window.APP_CONFIG = {
  // true: 서버 없이 브라우저 캔버스 필터로 변환을 흉내냄 (프론트 단독 테스트용)
  // false: Node.js 백엔드의 POST {API_BASE_URL}/api/transform 호출
  USE_MOCK: false,

  // 같은 서버에서 서빙하면 빈 문자열, 분리 배포 시 예) "https://my-api.vercel.app"
  API_BASE_URL: "",

  TRANSFORM_ENDPOINT: "/api/transform",
  HEALTH_ENDPOINT: "/api/health",
  REQUEST_TIMEOUT_MS: 150000, // 이미지 생성은 오래 걸릴 수 있음

  // 사용자가 고를 수 있는 원본 크기. 업로드 전에 아래 크기로 줄여서 보냄
  MAX_FILE_SIZE_MB: 20,
  UPLOAD_MAX_DIMENSION: 1536,
  ACCEPTED_TYPES: ["image/png", "image/jpeg", "image/webp"],

  // id 는 백엔드로 전송되는 값. 실제 프롬프트는 server/styles.js 에서 관리
  STYLES: [
    { id: "caricature",   name: "캐리커처",   emoji: "🤪", desc: "특징을 과장한 유쾌한 그림" },
    { id: "anime",        name: "애니메이션", emoji: "🌸", desc: "선명한 선과 셀 채색" },
    { id: "movie-poster", name: "영화 포스터", emoji: "🎬", desc: "드라마틱한 블록버스터 느낌" },
    { id: "pixel-art",    name: "픽셀 아트",  emoji: "👾", desc: "레트로 게임 도트 스타일" },
  ],
};
