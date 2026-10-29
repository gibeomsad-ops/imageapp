import OpenAI, { toFile } from "openai";
import { config } from "../config.js";

/**
 * 이미지 변환 서비스.
 * 반환값: { buffer: Buffer, mimeType: string }
 * 다른 AI 제공자를 붙일 때는 providers 에 같은 형태의 함수를 추가하면 됩니다.
 */

let openaiClient;
function getOpenAI() {
  if (!config.openai.apiKey) throw new HttpError(500, "서버에 OPENAI_API_KEY 가 설정되지 않았습니다.");
  openaiClient ??= new OpenAI({ apiKey: config.openai.apiKey });
  return openaiClient;
}

const providers = {
  async openai({ buffer, mimeType, fileName, prompt }) {
    const { model, size, quality, outputFormat } = config.openai;
    try {
      const result = await getOpenAI().images.edit({
        model,
        image: await toFile(buffer, fileName, { type: mimeType }),
        prompt,
        size,
        quality,
        output_format: outputFormat,
      });
      const b64 = result.data?.[0]?.b64_json;
      if (!b64) throw new HttpError(502, "AI 응답에 이미지가 없습니다.");
      return { buffer: Buffer.from(b64, "base64"), mimeType: `image/${outputFormat}` };
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw toHttpError(err);
    }
  },

  // API 키 없이 흐름을 확인하기 위한 모드: 잠시 기다렸다가 원본을 그대로 돌려줌
  async mock({ buffer, mimeType }) {
    await new Promise((r) => setTimeout(r, 1500));
    return { buffer, mimeType };
  },
};

export async function transformImage(input) {
  const provider = providers[config.provider];
  if (!provider) throw new HttpError(500, `알 수 없는 IMAGE_PROVIDER: ${config.provider}`);
  return provider(input);
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// OpenAI SDK 오류를 사용자에게 보여줄 메시지로 변환 (원문은 서버 로그에만 남김)
function toHttpError(err) {
  console.error("[openai]", err.status, err.code, err.message);
  if (err.code === "moderation_blocked") {
    return new HttpError(400, "안전 정책상 변환할 수 없는 이미지 또는 요청입니다. 다른 사진이나 요청사항으로 시도해 주세요.");
  }
  switch (err.status) {
    case 400:
      return new HttpError(400, "이미지를 처리할 수 없습니다. 다른 사진으로 시도해 주세요.");
    case 401:
    case 403:
      return new HttpError(500, "서버의 OpenAI API 키 설정을 확인해 주세요.");
    case 429:
      return new HttpError(429, "요청이 많습니다. 잠시 후 다시 시도해 주세요.");
    default:
      return new HttpError(502, "AI 이미지 변환에 실패했습니다.");
  }
}
