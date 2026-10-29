import dotenv from "dotenv";

dotenv.config({ quiet: true });

const env = process.env;

export const config = {
  port: Number(env.PORT) || 3000,
  corsOrigins: (env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean),

  // Vercel 서버리스 함수의 요청 본문 한도가 4.5MB 이므로 그보다 작게 유지
  maxUploadBytes: 4 * 1024 * 1024,
  acceptedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  maxPromptLength: 300,

  provider: env.IMAGE_PROVIDER || (env.OPENAI_API_KEY ? "openai" : "mock"),

  openai: {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst",
    size: env.OPENAI_IMAGE_SIZE || "1024x1024",
    quality: env.OPENAI_IMAGE_QUALITY || "medium",
    outputFormat: env.OPENAI_OUTPUT_FORMAT || "jpeg",
  },
};
