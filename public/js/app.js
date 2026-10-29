(() => {
  const cfg = window.APP_CONFIG;
  const $ = (id) => document.getElementById(id);

  const els = {
    modeBadge: $("modeBadge"),
    dropzone: $("dropzone"),
    fileInput: $("fileInput"),
    dropzoneEmpty: $("dropzoneEmpty"),
    dropzonePreview: $("dropzonePreview"),
    previewImg: $("previewImg"),
    fileName: $("fileName"),
    removeBtn: $("removeBtn"),
    maxSizeText: $("maxSizeText"),
    styleList: $("styleList"),
    extraPrompt: $("extraPrompt"),
    convertBtn: $("convertBtn"),
    statusText: $("statusText"),
    resultSection: $("resultSection"),
    compareSlider: $("compareSlider"),
    compareSide: $("compareSide"),
    compareBefore: $("compareBefore"),
    compareAfter: $("compareAfter"),
    compareRange: $("compareRange"),
    sideBefore: $("sideBefore"),
    sideAfter: $("sideAfter"),
    sideAfterCaption: $("sideAfterCaption"),
    retryBtn: $("retryBtn"),
    downloadBtn: $("downloadBtn"),
    toast: $("toast"),
  };

  const state = {
    file: null,
    originalUrl: null,
    resultUrl: null,
    styleId: null,
    loading: false,
  };

  /* ---------- 공통 ---------- */
  let toastTimer;
  function toast(message, isError = false) {
    els.toast.textContent = message;
    els.toast.classList.toggle("is-error", isError);
    els.toast.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("is-show"), 3000);
  }

  const getStyle = (id) => cfg.STYLES.find((s) => s.id === id);

  function updateConvertState() {
    const ready = state.file && state.styleId && !state.loading;
    els.convertBtn.disabled = !ready;
    els.convertBtn.classList.toggle("is-loading", state.loading);
    els.retryBtn.disabled = state.loading;

    if (state.loading) {
      els.statusText.textContent = `${getStyle(state.styleId).name} 스타일로 변환 중입니다… 잠시만 기다려 주세요.`;
    } else if (!state.file) {
      els.statusText.textContent = "사진을 업로드해 주세요.";
    } else if (!state.styleId) {
      els.statusText.textContent = "변환할 스타일을 선택해 주세요.";
    } else {
      els.statusText.textContent = "준비 완료! 변환 버튼을 눌러 주세요.";
    }
  }

  /* ---------- 1. 업로드 ---------- */
  function validateFile(file) {
    if (!cfg.ACCEPTED_TYPES.includes(file.type)) return "PNG, JPG, WEBP 이미지만 업로드할 수 있습니다.";
    if (file.size > cfg.MAX_FILE_SIZE_MB * 1024 * 1024) return `파일 크기는 ${cfg.MAX_FILE_SIZE_MB}MB 이하여야 합니다.`;
    return null;
  }

  function setFile(file) {
    const error = validateFile(file);
    if (error) return toast(error, true);

    if (state.originalUrl) URL.revokeObjectURL(state.originalUrl);
    state.file = file;
    state.originalUrl = URL.createObjectURL(file);

    els.previewImg.src = state.originalUrl;
    els.fileName.textContent = file.name;
    els.dropzoneEmpty.hidden = true;
    els.dropzonePreview.hidden = false;

    clearResult();
    updateConvertState();
  }

  els.fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) setFile(file);
    e.target.value = ""; // 같은 파일 재선택 허용
  });

  els.removeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    els.fileInput.click();
  });

  ["dragenter", "dragover"].forEach((type) =>
    els.dropzone.addEventListener(type, (e) => {
      e.preventDefault();
      els.dropzone.classList.add("is-dragover");
    })
  );
  ["dragleave", "drop"].forEach((type) =>
    els.dropzone.addEventListener(type, (e) => {
      e.preventDefault();
      els.dropzone.classList.remove("is-dragover");
    })
  );
  els.dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  });

  /* ---------- 2. 스타일 선택 ---------- */
  function renderStyles() {
    els.styleList.innerHTML = cfg.STYLES.map(
      (s) => `
        <button type="button" class="style-card" role="radio" aria-checked="false" data-id="${s.id}">
          <span class="style-card__emoji">${s.emoji}</span>
          <span class="style-card__name">${s.name}</span>
          <span class="style-card__desc">${s.desc}</span>
        </button>`
    ).join("");
  }

  els.styleList.addEventListener("click", (e) => {
    const card = e.target.closest(".style-card");
    if (!card) return;
    state.styleId = card.dataset.id;
    els.styleList.querySelectorAll(".style-card").forEach((el) => {
      const selected = el === card;
      el.classList.toggle("is-selected", selected);
      el.setAttribute("aria-checked", String(selected));
    });
    updateConvertState();
  });

  /* ---------- 3. 변환 ---------- */
  async function convert() {
    if (!state.file || !state.styleId || state.loading) return;
    // 변환 중에 사진이나 스타일이 바뀌어도 결과는 요청 당시 값과 짝지어 표시
    const { file, styleId } = state;
    state.loading = true;
    updateConvertState();

    try {
      const blob = await window.Api.transformImage({
        file,
        style: styleId,
        prompt: els.extraPrompt.value.trim(),
      });
      if (state.file !== file) return; // 그사이 다른 사진을 올렸으면 이전 결과는 버림
      showResult(blob, styleId);
      toast("변환이 완료되었습니다!");
    } catch (err) {
      console.error(err);
      toast(err.message || "변환 중 오류가 발생했습니다.", true);
    } finally {
      state.loading = false;
      updateConvertState();
    }
  }

  els.convertBtn.addEventListener("click", convert);
  els.retryBtn.addEventListener("click", convert);

  /* ---------- 4. 결과 비교 ---------- */
  function clearResult() {
    if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
    state.resultUrl = null;
    els.resultSection.hidden = true;
  }

  function showResult(blob, styleId) {
    if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
    state.resultUrl = URL.createObjectURL(blob);
    const style = getStyle(styleId);

    els.compareBefore.src = state.originalUrl;
    els.compareAfter.src = state.resultUrl;
    els.sideBefore.src = state.originalUrl;
    els.sideAfter.src = state.resultUrl;
    els.sideAfterCaption.textContent = `변환 · ${style.name}`;
    setSliderPos(50);

    // 5. 다운로드
    const ext = blob.type.split("/")[1] || "png";
    const baseName = state.file.name.replace(/\.[^.]+$/, "");
    els.downloadBtn.href = state.resultUrl;
    els.downloadBtn.download = `${baseName}_${style.id}.${ext}`;

    els.resultSection.hidden = false;
    els.resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setSliderPos(value) {
    els.compareRange.value = value;
    els.compareSlider.style.setProperty("--pos", `${value}%`);
  }

  els.compareRange.addEventListener("input", (e) => setSliderPos(e.target.value));

  document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      const isSlider = tab.dataset.view === "slider";
      document.querySelectorAll(".tab").forEach((t) => {
        t.classList.toggle("is-active", t === tab);
        t.setAttribute("aria-selected", String(t === tab));
      });
      els.compareSlider.hidden = !isSlider;
      els.compareSide.hidden = isSlider;
    })
  );

  /* ---------- 초기화 ---------- */
  els.maxSizeText.textContent = cfg.MAX_FILE_SIZE_MB;
  const MODE_LABELS = {
    openai: "AI 연결됨",
    mock: "서버 MOCK 모드",
    "browser-mock": "브라우저 MOCK 모드",
  };
  window.Api.getMode().then((mode) => {
    els.modeBadge.textContent = MODE_LABELS[mode] || "서버 연결 안 됨";
    els.modeBadge.classList.toggle("is-live", mode === "openai");
  });
  renderStyles();
  updateConvertState();
})();
