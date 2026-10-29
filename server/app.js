import express from "express";
import multer from "multer";
import { config } from "./config.js";
import { router } from "./routes/transform.js";

/**
 * Express 앱 정의. 실행(listen)은 하지 않습니다.
 *  - 로컬: server/local.js 가 정적 파일 서빙 + listen
 *  - Vercel: api/index.js 가 이 앱을 서버리스 함수로 export
 */
export const app = express();

app.disable("x-powered-by");

// 프론트를 다른 도메인에서 서빙할 때만 필요 (CORS_ORIGIN 지정 시)
if (config.corsOrigins.length) {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && config.corsOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
}

app.use("/api", router);

app.use("/api", (req, res) => {
  res.status(404).json({ error: "존재하지 않는 API 입니다." });
});

// 에러 응답은 항상 { error } JSON 형태
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? `파일 크기는 ${config.maxUploadBytes / 1024 / 1024}MB 이하여야 합니다.`
        : "업로드 요청이 올바르지 않습니다.";
    return res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: message });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 && !err.status ? "서버 오류가 발생했습니다." : err.message });
});
