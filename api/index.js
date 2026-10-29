// Vercel 서버리스 함수 진입점. vercel.json 의 rewrite 로 /api/* 요청이 모두 여기로 옵니다.
import { app } from "../server/app.js";

export default app;
