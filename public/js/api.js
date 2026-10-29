/**
 * 백엔드 통신 레이어
 *
 * 요청:  POST {API_BASE_URL}{TRANSFORM_ENDPOINT}
 *        Content-Type: multipart/form-data
 *        - image  : File   (원본 사진, 업로드 전 UPLOAD_MAX_DIMENSION 으로 축소)
 *        - style  : string (STYLES[].id)
 *        - prompt : string (사용자 추가 요청, 선택)
 *
 * 응답:  200 { "image": "<base64>", "mimeType": "image/jpeg", "provider": "openai" | "mock" }
 *        실패 시 4xx/5xx { "error": "메시지" }
 */
window.Api = (() => {
  const cfg = window.APP_CONFIG;

  function base64ToBlob(b64, type = "image/png") {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type });
  }

  // 큰 사진을 서버 한도(4MB) 안으로 줄이기 위해 긴 변을 maxDim 으로 축소해 JPEG 로 재인코딩
  async function resizeForUpload(file, maxDim = cfg.UPLOAD_MAX_DIMENSION) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 3 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  }

  async function requestServer({ file, style, prompt, signal }) {
    const form = new FormData();
    form.append("image", await resizeForUpload(file));
    form.append("style", style);
    if (prompt) form.append("prompt", prompt);

    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), cfg.REQUEST_TIMEOUT_MS);
    signal?.addEventListener("abort", () => timeout.abort());

    let res;
    try {
      res = await fetch(cfg.API_BASE_URL + cfg.TRANSFORM_ENDPOINT, {
        method: "POST",
        body: form,
        signal: timeout.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") throw new Error("요청 시간이 초과되었거나 취소되었습니다.");
      throw new Error("서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해 주세요.");
    } finally {
      clearTimeout(timer);
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `변환 실패 (HTTP ${res.status})`);
    if (!data.image) throw new Error("서버 응답에 이미지가 없습니다.");
    return base64ToBlob(data.image, data.mimeType);
  }

  /**
   * @returns {Promise<Blob>} 변환된 이미지
   */
  async function transformImage({ file, style, prompt = "", signal }) {
    if (cfg.USE_MOCK) return window.MockTransformer.transform(file, style);
    return requestServer({ file, style, prompt, signal });
  }

  /**
   * @returns {Promise<"openai" | "mock" | "browser-mock" | null>} 현재 변환 모드 (서버 연결 실패 시 null)
   */
  async function getMode() {
    if (cfg.USE_MOCK) return "browser-mock";
    try {
      const res = await fetch(cfg.API_BASE_URL + cfg.HEALTH_ENDPOINT);
      if (!res.ok) return null;
      return (await res.json()).provider;
    } catch {
      return null;
    }
  }

  return { transformImage, getMode };
})();
