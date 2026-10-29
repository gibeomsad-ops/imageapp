/**
 * 스타일별 프롬프트. 프론트엔드는 id 만 보내고, 실제 프롬프트는 서버에서만 관리합니다.
 * 스타일을 추가할 때는 여기와 public/js/config.js 의 STYLES 에 같은 id 로 추가하세요.
 */
export const STYLE_PROMPTS = {
  caricature:
    "Transform this photo into a playful hand-drawn caricature. Exaggerate the most distinctive facial features " +
    "(big head, expressive eyes, wide smile) while keeping the person clearly recognizable. " +
    "Clean ink outlines, bright marker colors, simple background.",
  anime:
    "Redraw this photo in a modern Japanese anime style. Clean line art, cel shading, large expressive eyes, " +
    "vibrant colors and a soft painted background. Keep the person's hairstyle, clothing and pose.",
  "movie-poster":
    "Turn this photo into a dramatic Hollywood blockbuster movie poster. Cinematic teal-and-orange lighting, " +
    "epic background, lens flare, and a bold movie title with credits text at the bottom. " +
    "The person is the hero of the movie and must stay recognizable.",
  "pixel-art":
    "Redraw this photo as retro 16-bit pixel art like a classic video game sprite scene. " +
    "Limited color palette, visible square pixels, no anti-aliasing. Keep the person recognizable.",
};

export function buildPrompt(styleId, extra = "") {
  const base = STYLE_PROMPTS[styleId];
  if (!base) return null;
  return extra ? `${base}\nAdditional request from the user: ${extra}` : base;
}
