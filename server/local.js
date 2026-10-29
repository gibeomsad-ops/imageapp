import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { app } from "./app.js";
import { config } from "./config.js";

// 로컬 개발용 진입점. Vercel 에서는 public/ 을 CDN 이 직접 서빙하므로 사용되지 않습니다.
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
app.use(express.static(publicDir));

app.listen(config.port, () => {
  console.log(`✦ Toonify 서버 실행 중: http://localhost:${config.port}`);
  console.log(`  이미지 변환 모드: ${config.provider}`);
});
