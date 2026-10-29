(() => {
  if (window.__teacherAnnotateProLoaded) {
    window.__teacherAnnotateProToggle?.();
    return;
  }
  window.__teacherAnnotateProLoaded = true;

  const state = {
    tool: "pen", color: "#ff315b", size: 4, opacity: 1,
    drawing: false, start: null, last: null, visible: true,
    history: [], redo: [], dpr: Math.max(1, window.devicePixelRatio || 1)
  };

  const root = document.createElement("div");
  root.id = "tap-root";
  root.innerHTML = `
    <div id="tap-toolbar" role="toolbar" aria-label="Teacher Annotate Pro">
      <button class="tap-brand" data-action="toggle" title="Ocultar/mostrar barra">✦</button>
      <span class="tap-separator"></span>
      <button data-tool="cursor" title="Cursor / navegar (Esc)">↖</button>
      <button data-tool="pen" class="active" title="Caneta (P)">✎</button>
      <button data-tool="highlighter" title="Marca-texto (H)">▰</button>
      <button data-tool="arrow" title="Seta (A)">➜</button>
      <button data-tool="line" title="Linha (L)">／</button>
      <button data-tool="rect" title="Retângulo (R)">□</button>
      <button data-tool="circle" title="Círculo (C)">○</button>
      <button data-tool="text" title="Texto (T)">T</button>
      <button data-tool="eraser" title="Borracha (E)">⌫</button>
      <span class="tap-separator"></span>
      <input id="tap-color" type="color" value="#ff315b" title="Cor" aria-label="Cor">
      <input id="tap-size" type="range" min="1" max="24" value="4" title="Espessura" aria-label="Espessura">
      <button data-action="undo" title="Desfazer (Ctrl+Z)">↶</button>
      <button data-action="redo" title="Refazer (Ctrl+Y)">↷</button>
      <button data-action="show" title="Mostrar/ocultar anotações">◉</button>
      <button data-action="download" title="Exportar anotações PNG">⇩</button>
      <button data-action="clear" title="Limpar anotações">⌫</button>
      <button data-action="close" title="Fechar ferramenta">✕</button>
    </div>
    <div id="tap-hint">Teacher Annotate Pro · Escolha uma ferramenta para começar</div>
    <canvas id="tap-canvas"></canvas>
  `;
  document.documentElement.appendChild(root);

  const canvas = root.querySelector("#tap-canvas");
  const ctx = canvas.getContext("2d");
  const toolbar = root.querySelector("#tap-toolbar");
  const hint = root.querySelector("#tap-hint");
  let toolbarCollapsed = false;

  function resize() {
    const old = document.createElement("canvas");
    old.width = canvas.width; old.height = canvas.height;
    old.getContext("2d").drawImage(canvas, 0, 0);
    state.dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * state.dpr);
    canvas.height = Math.round(window.innerHeight * state.dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    if (old.width && old.height) ctx.drawImage(old, 0, 0, old.width / state.dpr, old.height / state.dpr);
    saveHistory();
  }

  function saveHistory() {
    try {
      state.history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (state.history.length > 30) state.history.shift();
      state.redo = [];
    } catch (_) {}
  }

  function restoreImage(imageData) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (imageData) ctx.putImageData(imageData, 0, 0);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function setTool(tool) {
    state.tool = tool;
    toolbar.querySelectorAll("[data-tool]").forEach(b => b.classList.toggle("active", b.dataset.tool === tool));
    canvas.classList.toggle("tap-cursor-mode", tool === "cursor");
    canvas.style.pointerEvents = tool === "cursor" ? "none" : "auto";
    hint.textContent = tool === "cursor" ? "Modo cursor: navegue pela página normalmente" : "Ferramenta: " + tool + " · Esc para navegar";
  }

  function point(e) { return { x: e.clientX, y: e.clientY }; }
  function applyStyle() {
    ctx.strokeStyle = state.color;
    ctx.fillStyle = state.color;
    ctx.lineWidth = state.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = state.tool === "highlighter" ? 0.28 : 1;
  }

  function drawShape(p) {
    const x = state.start.x, y = state.start.y, w = p.x - x, h = p.y - y;
    if (state.tool === "rect") ctx.strokeRect(x, y, w, h);
    if (state.tool === "line") { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    if (state.tool === "circle") {
      ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (state.tool === "arrow") {
      const angle = Math.atan2(h, w), head = Math.max(10, state.size * 3);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - head * Math.cos(angle - 0.48), p.y - head * Math.sin(angle - 0.48));
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - head * Math.cos(angle + 0.48), p.y - head * Math.sin(angle + 0.48)); ctx.stroke();
    }
  }

  canvas.addEventListener("pointerdown", e => {
    if (state.tool === "cursor") return;
    if (e.button !== 0) return;
    e.preventDefault();
    const p = point(e);
    state.drawing = true; state.start = p; state.last = p;
    canvas.setPointerCapture?.(e.pointerId);
    if (["pen", "highlighter", "eraser"].includes(state.tool)) {
      saveHistory(); applyStyle();
      if (state.tool === "eraser") { ctx.globalCompositeOperation = "destination-out"; ctx.lineWidth = state.size * 4; }
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
    } else if (["rect", "circle", "arrow", "line"].includes(state.tool)) {
      saveHistory();
    }
  });

  canvas.addEventListener("pointermove", e => {
    if (!state.drawing) return;
    const p = point(e);
    if (["pen", "highlighter", "eraser"].includes(state.tool)) {
      applyStyle();
      if (state.tool === "eraser") { ctx.globalCompositeOperation = "destination-out"; ctx.lineWidth = state.size * 4; }
      ctx.lineTo(p.x, p.y); ctx.stroke(); state.last = p;
    } else if (["rect", "circle", "arrow", "line"].includes(state.tool)) {
      const previous = state.history[state.history.length - 1];
      restoreImage(previous); applyStyle(); drawShape(p);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  });

  function finish(e) {
    if (!state.drawing) return;
    state.drawing = false;
    const p = point(e);
    if (["rect", "circle", "arrow", "line"].includes(state.tool)) {
      restoreImage(state.history[state.history.length - 1]); applyStyle(); drawShape(p);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("pointercancel", finish);

  canvas.addEventListener("dblclick", e => {
    if (state.tool !== "text") return;
    e.preventDefault();
    const text = window.prompt("Digite o texto da anotação:");
    if (!text) return;
    saveHistory(); applyStyle();
    ctx.font = Math.max(16, state.size * 5) + "px Arial, sans-serif";
    ctx.fillText(text, e.clientX, e.clientY);
    ctx.globalAlpha = 1;
  });

  toolbar.querySelector("#tap-color").addEventListener("input", e => state.color = e.target.value);
  toolbar.querySelector("#tap-size").addEventListener("input", e => state.size = Number(e.target.value));
  toolbar.querySelectorAll("[data-tool]").forEach(b => b.addEventListener("click", () => setTool(b.dataset.tool)));

  toolbar.addEventListener("click", e => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "toggle") {
      toolbarCollapsed = !toolbarCollapsed;
      toolbar.querySelectorAll("button:not(.tap-brand), input, .tap-separator").forEach(el => el.style.display = toolbarCollapsed ? "none" : "");
      hint.style.display = toolbarCollapsed ? "none" : "";
    }
    if (action === "undo" && state.history.length > 1) {
      state.redo.push(state.history.pop()); restoreImage(state.history[state.history.length - 1]);
    }
    if (action === "redo" && state.redo.length) {
      const next = state.redo.pop(); state.history.push(next); restoreImage(next);
    }
    if (action === "show") {
      state.visible = !state.visible; canvas.style.visibility = state.visible ? "visible" : "hidden";
    }
    if (action === "clear" && confirm("Apagar todas as anotações desta página?")) {
      saveHistory(); ctx.clearRect(0, 0, canvas.width, canvas.height); saveHistory();
    }
    if (action === "download") {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width; exportCanvas.height = canvas.height;
      exportCanvas.getContext("2d").drawImage(canvas, 0, 0);
      const link = document.createElement("a");
      link.download = "teacher-annotate-anotacoes.png";
      link.href = exportCanvas.toDataURL("image/png"); link.click();
    }
    if (action === "close") {
      root.remove(); window.__teacherAnnotateProLoaded = false; window.__teacherAnnotateProToggle = null;
    }
  });

  toolbar.addEventListener("pointerdown", e => {
    if (e.target.closest("button, input")) return;
    const rect = toolbar.getBoundingClientRect();
    const offsetX = e.clientX - rect.left, offsetY = e.clientY - rect.top;
    const move = ev => {
      toolbar.style.left = Math.max(0, Math.min(innerWidth - toolbar.offsetWidth, ev.clientX - offsetX)) + "px";
      toolbar.style.top = Math.max(0, Math.min(innerHeight - toolbar.offsetHeight, ev.clientY - offsetY)) + "px";
      toolbar.style.transform = "none";
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  });

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", e => {
    if (e.key === "Escape") setTool("cursor");
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); toolbar.querySelector('[data-action="undo"]').click(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); toolbar.querySelector('[data-action="redo"]').click(); }
    if (e.target.matches("input, textarea")) return;
    const keys = { p: "pen", h: "highlighter", a: "arrow", l: "line", r: "rect", c: "circle", t: "text", e: "eraser" };
    if (keys[e.key.toLowerCase()]) setTool(keys[e.key.toLowerCase()]);
  });

  resize();
  saveHistory();
  setTool("pen");
  window.__teacherAnnotateProToggle = () => { root.style.display = root.style.display === "none" ? "" : "none"; };
})();