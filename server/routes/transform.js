import { Router } from "express";
import { config } from "../config.js";
import { buildPrompt, STYLE_PROMPTS } from "../styles.js";
import { uploadImage } from "../middleware/upload.js";
import { transformImage, HttpError } from "../services/imageService.js";

export const router = Router();

// 서버 상태 및 현재 동작 모드 확인
router.get("/health", (req, res) => {
  res.json({ ok: true, provider: config.provider, styles: Object.keys(STYLE_PROMPTS) });
});

/**
 * POST /api/transform  (multipart/form-data)
 *   image  : File
 *   style  : caricature | anime | movie-poster | pixel-art
 *   prompt : string (선택)
 * → 200 { image: base64, mimeType, provider }
 */
router.post("/transform", uploadImage, async (req, res) => {
  if (!req.file) throw new HttpError(400, "이미지 파일이 없습니다.");

  const style = String(req.body.style || "");
  const extra = String(req.body.prompt || "").trim().slice(0, config.maxPromptLength);
  const prompt = buildPrompt(style, extra);
  if (!prompt) throw new HttpError(400, `지원하지 않는 스타일입니다: ${style}`);

  const result = await transformImage({
    buffer: req.file.buffer,
    mimeType: req.file.mimetype,
    fileName: req.file.originalname || "image.png",
    prompt,
  });

  res.json({
    image: result.buffer.toString("base64"),
    mimeType: result.mimeType,
    provider: config.provider,
  });
});
