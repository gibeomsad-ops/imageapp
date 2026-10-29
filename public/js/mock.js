/**
 * 백엔드 없이 UI를 테스트하기 위한 Mock 변환기.
 * 실제 AI가 아니라 캔버스 필터로 스타일을 흉내냅니다. (APP_CONFIG.USE_MOCK = true 일 때만 사용)
 */
window.MockTransformer = (() => {
  const MAX_SIZE = 768;
  const DELAY_MS = 1200;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function loadImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function createCanvas(img, filter = "none") {
    const scale = Math.min(1, MAX_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.filter = filter;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    return { canvas, ctx };
  }

  const posterize = (v, levels) => Math.round((v / 255) * (levels - 1)) * (255 / (levels - 1));

  // 캐리커처: 얼굴이 있을 법한 영역을 볼록 렌즈처럼 확대
  function caricature(img) {
    const { canvas, ctx } = createCanvas(img, "saturate(1.4) contrast(1.1)");
    const { width: w, height: h } = canvas;
    const src = ctx.getImageData(0, 0, w, h);
    const out = ctx.createImageData(w, h);
    const cx = w / 2, cy = h * 0.42, radius = Math.min(w, h) * 0.38;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sx = x, sy = y;
        const dx = x - cx, dy = y - cy;
        const d = Math.hypot(dx, dy) / radius;
        if (d < 1) {
          const f = Math.pow(d, 1.6) / (d || 1);
          sx = cx + dx * f;
          sy = cy + dy * f;
        }
        const si = (Math.min(h - 1, Math.round(sy)) * w + Math.min(w - 1, Math.round(sx))) * 4;
        const di = (y * w + x) * 4;
        out.data[di] = src.data[si];
        out.data[di + 1] = src.data[si + 1];
        out.data[di + 2] = src.data[si + 2];
        out.data[di + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
    return canvas;
  }

  // 애니메이션: 색 단순화 + 외곽선
  function anime(img) {
    const { canvas, ctx } = createCanvas(img, "saturate(1.6) brightness(1.08) blur(1px)");
    const { width: w, height: h } = canvas;
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const lum = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      lum[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    }
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx = lum[i - w + 1] + 2 * lum[i + 1] + lum[i + w + 1] - lum[i - w - 1] - 2 * lum[i - 1] - lum[i + w - 1];
        const gy = lum[i + w - 1] + 2 * lum[i + w] + lum[i + w + 1] - lum[i - w - 1] - 2 * lum[i - w] - lum[i - w + 1];
        const edge = Math.hypot(gx, gy) > 90;
        for (let c = 0; c < 3; c++) {
          d[i * 4 + c] = edge ? 30 : posterize(d[i * 4 + c], 6);
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  // 영화 포스터: 틸&오렌지 색보정 + 비네팅 + 타이틀
  function moviePoster(img) {
    const { canvas, ctx } = createCanvas(img, "contrast(1.25) saturate(1.15)");
    const { width: w, height: h } = canvas;
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const l = (d[i] + d[i + 1] + d[i + 2]) / 765; // 0~1
      d[i] = Math.min(255, d[i] + (l - 0.5) * 50);
      d[i + 1] = Math.min(255, d[i + 1] + (l - 0.5) * 10);
      d[i + 2] = Math.min(255, d[i + 2] - (l - 0.5) * 50);
    }
    ctx.putImageData(imgData, 0, 0);

    const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    const bottom = ctx.createLinearGradient(0, h * 0.6, 0, h);
    bottom.addColorStop(0, "rgba(0,0,0,0)");
    bottom.addColorStop(1, "rgba(0,0,0,0.9)");
    ctx.fillStyle = bottom;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);

    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,.6)";
    ctx.shadowBlur = 12;
    ctx.font = `900 ${Math.round(w * 0.11)}px "Noto Sans KR", sans-serif`;
    ctx.fillText("THE LEGEND", w / 2, h * 0.88);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f5c518";
    ctx.font = `700 ${Math.round(w * 0.035)}px "Noto Sans KR", sans-serif`;
    ctx.fillText("COMING SOON · STARRING YOU", w / 2, h * 0.94);
    return canvas;
  }

  // 픽셀 아트: 저해상도로 줄였다가 계단식으로 확대
  function pixelArt(img) {
    const { canvas, ctx } = createCanvas(img, "saturate(1.3)");
    const { width: w, height: h } = canvas;
    const blocks = 64;
    const sw = blocks, sh = Math.max(1, Math.round((h / w) * blocks));
    const small = document.createElement("canvas");
    small.width = sw;
    small.height = sh;
    const sctx = small.getContext("2d", { willReadFrequently: true });
    sctx.drawImage(canvas, 0, 0, sw, sh);
    const data = sctx.getImageData(0, 0, sw, sh);
    for (let i = 0; i < data.data.length; i += 4) {
      for (let c = 0; c < 3; c++) data.data[i + c] = posterize(data.data[i + c], 5);
    }
    sctx.putImageData(data, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(small, 0, 0, w, h);
    return canvas;
  }

  const EFFECTS = {
    caricature,
    anime,
    "movie-poster": moviePoster,
    "pixel-art": pixelArt,
  };

  async function transform(file, style) {
    const effect = EFFECTS[style];
    if (!effect) throw new Error(`지원하지 않는 스타일입니다: ${style}`);
    const [img] = await Promise.all([loadImage(file), wait(DELAY_MS)]);
    const canvas = effect(img);
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("이미지 생성 실패"))), "image/png")
    );
  }

  return { transform };
})();
