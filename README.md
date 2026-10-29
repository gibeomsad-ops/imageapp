# Toonify — AI 캐리커처 생성기

사진을 올리고 스타일을 고르면 AI가 캐리커처 · 애니메이션 · 영화 포스터 · 픽셀 아트로 바꿔 주는 웹 앱입니다.

- **프론트엔드**: HTML / CSS / JavaScript (빌드 도구 없음)
- **백엔드**: Node.js + Express
- **AI**: OpenAI 이미지 편집 API (`gpt-image-2.5-sunburst`)
- **배포**: Vercel

## 주요 기능

- 사진 업로드 (클릭 · 드래그 앤 드롭, PNG/JPG/WEBP)
- 변환 스타일 선택 + 추가 요청사항 입력
- 원본 ↔ 변환 결과 비교 (슬라이더 / 나란히 보기)
- 변환 결과 다운로드
- 변환 중 로딩 표시, 오류 안내 메시지

## 로컬에서 실행하기

Node.js 20 이상이 필요합니다.

```bash
npm install
cp .env.example .env     # .env 를 열어 OPENAI_API_KEY 입력
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

API 키를 비워 두면 **MOCK 모드**로 동작합니다. 서버가 원본 이미지를 그대로 돌려주므로 비용 없이 화면 흐름을 확인할 수 있습니다.

## 환경변수

| 이름 | 기본값 | 설명 |
|---|---|---|
| `OPENAI_API_KEY` | — | OpenAI API 키 (없으면 MOCK 모드) |
| `OPENAI_IMAGE_MODEL` | `gpt-image-2.5-sunburst` | 이미지 편집 모델 |
| `OPENAI_IMAGE_QUALITY` | `medium` | `low` · `medium` · `high` · `xhigh` · `max` (높을수록 느리고 비쌈) |
| `OPENAI_IMAGE_SIZE` | `1024x1024` | 출력 크기 |
| `OPENAI_OUTPUT_FORMAT` | `jpeg` | `jpeg` · `png` · `webp` |
| `IMAGE_PROVIDER` | 자동 | `openai` 또는 `mock` 강제 지정 |
| `PORT` | `3000` | 로컬 서버 포트 |

API 키는 서버에서만 읽으며 브라우저로 전달되지 않습니다. `.env` 는 `.gitignore` 로 제외됩니다.

## 프로젝트 구조

```
public/          프론트엔드 (Vercel 에서는 CDN 이 서빙)
server/          Express 앱 (라우트, 업로드 처리, OpenAI 연동, 스타일 프롬프트)
  app.js         Express 앱 정의
  local.js       로컬 실행용 (정적 파일 서빙 + listen)
api/index.js     Vercel 서버리스 함수 진입점 → server/app.js
vercel.json      /api/* 라우팅, 함수 실행 시간
```

## API

`POST /api/transform` (`multipart/form-data`)

| 필드 | 설명 |
|---|---|
| `image` | 원본 사진 (최대 4MB, 브라우저가 업로드 전 자동 축소) |
| `style` | `caricature` · `anime` · `movie-poster` · `pixel-art` |
| `prompt` | 추가 요청사항 (선택, 300자) |

응답: `{ "image": "<base64>", "mimeType": "image/jpeg", "provider": "openai" }`
오류: `{ "error": "메시지" }`

`GET /api/health` — 서버 상태와 현재 모드 확인

## Vercel 배포

1. [vercel.com/new](https://vercel.com/new) 에서 이 GitHub 저장소를 Import
2. **Environment Variables** 에 `OPENAI_API_KEY` 추가
3. Deploy — 별도 빌드 설정은 필요 없습니다

참고: Vercel 요청 본문 한도(4.5MB)에 맞춰 업로드 이미지는 브라우저에서 축소되고, 함수 실행 시간은 120초로 설정되어 있습니다.
