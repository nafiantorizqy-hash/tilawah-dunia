"use strict";

/* ==========================================================================
   Tilawah Dunia — logika halaman
   Bagian: 1) utilitas  2) katalog audio  3) lembar & buku  4) kaca pembesar
           5) pemutar   6) kajian        7) mulai
   ========================================================================== */
(() => {

  /* ---------- 1) utilitas ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad3 = (n) => String(n).padStart(3, "0");
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const fmtTime = (s) => (isFinite(s) && s >= 0)
    ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00";

  QARI.forEach((e) => { e.groups = [...new Set(e.readings.map((r) => r.group))]; });

  const els = {
    stage: $("#stage"), book: $("#book"), mobile: $("#mobile"),
    prev: $("#prevPage"), next: $("#nextPage"), label: $("#pageLabel"),
    toc: $("#toc"), filters: $("#filters"), notice: $("#notice"),
    lens: $("#lens"), lensGlass: $("#lensGlass"), lensToggle: $("#lensToggle"),
    zoomIn: $("#zoomIn"), zoomOut: $("#zoomOut"), zoomVal: $("#zoomVal"),
    audio: $("#audio")
  };
  const mq = window.matchMedia("(max-width: 899px)");

  /* ---------- 2) katalog audio (mp3quran.net) ---------- */
  const API = "https://mp3quran.net/api/v3/reciters?language=eng";
  let catalog = null;
  let catalogPromise = null;
  const resolved = new Map();      // "idQari:indeksRiwayat" -> { server, surahs, reciter } | { missing: true }

  function loadCatalog() {
    if (catalog) return Promise.resolve(catalog);
    if (!catalogPromise) {
      catalogPromise = fetch(API)
        .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then((j) => { catalog = j.reciters || []; return catalog; })
        .catch((err) => {
          console.warn("Katalog mp3quran gagal dimuat:", err);
          catalogPromise = null;
          return null;
        });
    }
    return catalogPromise;
  }

  const tokenHit = (name, token) => token.split("|").some((t) => norm(name).includes(norm(t)));

  function findSource(e, r) {
    if (!catalog || !r.moshaf) return null;
    const keys = (e.keys || []).map(norm);
    const pool = e.dynamic ? catalog : catalog.filter((rc) => keys.some((k) => norm(rc.name).includes(k)));
    for (const rc of pool) {
      const list = (rc.moshaf || []).filter((m) => r.moshaf.every((t) => tokenHit(m.name, t)));
      if (!list.length) continue;
      const pick = (r.prefer && list.find((m) => r.prefer.every((t) => tokenHit(m.name, t)))) || list[0];
      const server = pick.server.endsWith("/") ? pick.server : pick.server + "/";
      const surahs = String(pick.surah_list || "").split(",").map(Number).filter(Boolean);
      return { server, surahs, reciter: rc.name, moshaf: pick.name };
    }
    return null;
  }

  async function resolveReading(e, ri) {
    const key = e.id + ":" + ri;
    if (resolved.has(key)) return resolved.get(key);
    await loadCatalog();
    const r = e.readings[ri];
    let src = findSource(e, r);
    if (!src && r.fallbackServer) src = { server: r.fallbackServer, surahs: null, reciter: e.name, fallback: true };
    if (!src && catalog) src = { missing: true };
    if (src) resolved.set(key, src);
    return src;                  // null bila katalog gagal dan tidak ada fallback
  }

  async function resolveAll() {
    await loadCatalog();
    if (!catalog) return;
    for (const e of QARI) {
      if (e.noAudio) continue;
      for (let i = 0; i < e.readings.length; i++) await resolveReading(e, i);
      const first = resolved.get(e.id + ":0");
      if (e.dynamic && first && first.reciter) e.reciterName = first.reciter;
    }
  }

  /* ---------- 3) lembar & buku ---------- */
  let entries = QARI.slice();
  let pos = 0;                   // desktop: 0..E (E = penutup). mobile: 0..E-1
  let filter = "all";
  const sel = {};                // pilihan riwayat & surah per qari: { idQari: {ri, surah} }
  const getSel = (e) => (sel[e.id] ||= { ri: 0, surah: 1 });

  const ARCH = "M66 340 V196 C66 122 132 84 200 34 C268 84 334 122 334 196 V340 Z";

  function plateSVG(e, idx) {
    const { paper, accent } = e.palette;
    const id = e.id;
    const photo = e.photo
      ? `<image class="ph" href="${e.photo}" x="60" y="30" width="280" height="310" preserveAspectRatio="xMidYMid slice"/>`
      : "";
    return `
<svg viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lembar ${idx + 1}: ${e.name}">
  <defs>
    <pattern id="pt-${id}" width="44" height="44" patternUnits="userSpaceOnUse">
      <rect x="8" y="8" width="28" height="28" fill="none" stroke="${accent}" stroke-width=".9"/>
      <rect x="8" y="8" width="28" height="28" fill="none" stroke="${accent}" stroke-width=".9" transform="rotate(45 22 22)"/>
    </pattern>
    <pattern id="pl-${id}" width="44" height="44" patternUnits="userSpaceOnUse">
      <rect x="8" y="8" width="28" height="28" fill="none" stroke="${paper}" stroke-width=".9"/>
      <rect x="8" y="8" width="28" height="28" fill="none" stroke="${paper}" stroke-width=".9" transform="rotate(45 22 22)"/>
    </pattern>
    <clipPath id="ar-${id}"><path d="${ARCH}"/></clipPath>
  </defs>
  <rect width="400" height="520" fill="${paper}"/>
  <rect width="400" height="520" fill="url(#pt-${id})" opacity=".24"/>
  <g clip-path="url(#ar-${id})">
    <rect x="60" y="30" width="280" height="310" fill="${accent}"/>
    <rect x="60" y="30" width="280" height="310" fill="url(#pl-${id})" opacity=".2"/>
    <circle cx="200" cy="182" r="46" fill="${paper}"/>
    <circle cx="217" cy="173" r="40" fill="${accent}"/>
    <path d="M252 134l3.6 9.4 9.4 3.6-9.4 3.6-3.6 9.4-3.6-9.4-9.4-3.6 9.4-3.6z" fill="${paper}"/>
    <text x="200" y="300" text-anchor="middle" class="svg-code" font-size="22" fill="${paper}" opacity=".7">${e.code}</text>
    ${photo}
  </g>
  <path d="${ARCH}" fill="none" stroke="#1f2624" stroke-width="2.6" filter="url(#rough)"/>
  <path d="M78 334 V198 C78 132 138 98 200 54 C262 98 322 132 322 198 V334" fill="none" stroke="#1f2624" stroke-width="1" opacity=".55" filter="url(#rough)"/>
  <line x1="44" y1="356" x2="356" y2="356" stroke="#1f2624" stroke-width="1.5" filter="url(#rough)"/>
  <text class="svg-ar" x="200" y="402" text-anchor="middle" font-size="31" fill="#1f2624">${e.arabic}</text>
  <text class="svg-la" x="200" y="436" text-anchor="middle" font-size="24" fill="#1f2624">${e.name}</text>
  <text class="svg-sub" x="200" y="458" text-anchor="middle" fill="#56615c">${e.sub}</text>
  <g transform="rotate(-10 340 488)">
    <circle cx="340" cy="488" r="22" fill="none" stroke="${accent}" stroke-width="2" filter="url(#rough)"/>
    <text class="svg-code" x="340" y="493" text-anchor="middle" fill="${accent}">${e.code}</text>
  </g>
  <text class="svg-hand" x="40" y="494" fill="#56615c">lembar ${idx + 1}</text>
</svg>`;
  }

  function makePlate(e, idx) {
    const p = el("div", "plate");
    p.dataset.plate = idx;
    p.innerHTML = plateSVG(e, idx);
    const img = $("image.ph", p);
    if (img) img.addEventListener("error", () => img.remove());
    return p;
  }

  function makeColophonPlate(idx) {
    const p = el("div", "plate");
    p.dataset.plate = idx;
    p.innerHTML = `
<svg viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Halaman penutup">
  <rect width="400" height="520" fill="#e6e1d1"/>
  <text class="svg-ar" x="200" y="250" text-anchor="middle" font-size="96" fill="#1f2624">تمت</text>
  <line x1="120" y1="290" x2="280" y2="290" stroke="#1f2624" stroke-width="1.5" filter="url(#rough)"/>
  <text class="svg-la" x="200" y="332" text-anchor="middle" font-size="30" fill="#1f2624">tamat</text>
</svg>`;
    return p;
  }

  function makeClose() {
    const d = el("div", "close");
    d.innerHTML = `
      <h3>Buku ini berhenti di sini.</h3>
      <p>${entries.length} lembar, ${new Set(entries.flatMap((e) => e.groups)).size} kelompok qiraat. Kembali ke awal untuk mendengarkan qari yang lain.</p>`;
    const b = el("button", "btn-play", "Kembali ke lembar pertama");
    b.type = "button";
    b.addEventListener("click", () => goTo(0));
    d.append(b);
    return d;
  }

  function makeInfo(e) {
    const s = getSel(e);
    const w = el("div", "info");
    w.dataset.entry = e.id;
    const readings = e.readings.map((r) =>
      `<li><span class="tag ${r.group}">${GROUPS[r.group].short}</span><span class="rt"><span>${r.label}</span>${r.note ? `<span class="rn">${r.note}</span>` : ""}</span></li>`).join("");
    w.innerHTML = `
      <p class="ar" lang="ar" dir="rtl">${e.arabic}</p>
      <h3>${e.name}</h3>
      <p class="origin">${e.origin}</p>
      <p class="bio">${e.bio}</p>
      <ul class="rd">${readings}</ul>
      ${e.dynamic ? `<p class="dyn">Qari: <strong data-dyn="${e.id}">${e.reciterName || "dimuat dari katalog…"}</strong></p>` : ""}
      ${e.noAudio
        ? `<p class="note-noaudio">Belum ada rekaman audio untuk kelompok ini di katalog yang dipakai.</p>`
        : `<div class="listen">
             <label class="fld rsel" ${e.readings.length < 2 ? "hidden" : ""}><span>Riwayat</span>
               <select class="reading-select" aria-label="Riwayat untuk ${e.name}"></select></label>
             <label class="fld"><span>Surah</span>
               <select class="surah-select" aria-label="Surah untuk ${e.name}"></select></label>
             <button type="button" class="btn-play">Putar</button>
           </div>`}`;
    if (!e.noAudio) {
      const rSel = $(".reading-select", w);
      const sSel = $(".surah-select", w);
      e.readings.forEach((r, i) => rSel.append(new Option(r.label, i)));
      SURAH.forEach((n, i) => sSel.append(new Option(`${i + 1}. ${n}`, i + 1)));
      rSel.value = s.ri; sSel.value = s.surah;
      rSel.addEventListener("change", () => { s.ri = +rSel.value; paintInfo(w); });
      sSel.addEventListener("change", () => { s.surah = +sSel.value; });
      $(".btn-play", w).addEventListener("click", () => play(e, s.ri, s.surah));
      paintInfo(w);
    }
    return w;
  }

  /* tandai riwayat / surah yang tidak tersedia setelah katalog terbaca */
  function paintInfo(w) {
    const e = QARI.find((q) => q.id === w.dataset.entry);
    if (!e || e.noAudio) return;
    const s = getSel(e);
    const rSel = $(".reading-select", w);
    const sSel = $(".surah-select", w);
    e.readings.forEach((r, i) => {
      const src = resolved.get(e.id + ":" + i);
      const missing = src && src.missing;
      rSel.options[i].disabled = !!missing;
      rSel.options[i].textContent = r.label + (missing ? " (belum tersedia)" : "");
    });
    const cur = resolved.get(e.id + ":" + s.ri);
    const avail = cur && cur.surahs ? new Set(cur.surahs) : null;
    [...sSel.options].forEach((o) => { o.disabled = avail ? !avail.has(+o.value) : false; });
    const dyn = $("[data-dyn]", w);
    if (dyn && e.reciterName) dyn.textContent = e.reciterName;
  }

  function refreshUI() {
    $$(".info[data-entry]").forEach(paintInfo);
    $$("[data-dyn]").forEach((n) => {
      const e = QARI.find((q) => q.id === n.dataset.dyn);
      if (e && e.reciterName) n.textContent = e.reciterName;
    });
  }

  /* --- buku dua halaman (desktop) --- */
  let leaves = [];
  let baseRight = null;
  let lensTimer = 0;

  function buildBook() {
    const E = entries.length;
    els.book.innerHTML = "";
    leaves = [];
    const baseLeft = el("div", "page base-left");
    baseLeft.append(makePlate(entries[0], 0));
    baseRight = el("div", "page base-right");
    baseRight.append(makeClose());
    els.book.append(baseLeft, baseRight);
    for (let j = 0; j < E; j++) {
      const leaf = el("div", "leaf");
      leaf.dataset.i = j;
      const front = el("div", "face front");
      front.append(makeInfo(entries[j]));
      const back = el("div", "face back");
      back.append(j + 1 < E ? makePlate(entries[j + 1], j + 1) : makeColophonPlate(E));
      leaf.append(front, back);
      els.book.append(leaf);
      leaves.push(leaf);
    }
    syncLeaves();
  }

  function applyZ(leaf, j) {
    leaf.style.zIndex = j < pos ? j + 1 : leaves.length - j + 1;
  }

  function syncLeaves() {
    const E = leaves.length;
    leaves.forEach((leaf, j) => {
      leaf.classList.toggle("flipped", j < pos);
      applyZ(leaf, j);
      $(".front", leaf).inert = j !== pos;
    });
    if (baseRight) baseRight.inert = pos !== E;
  }

  function animateLeaf(leaf, j, dir) {
    leaf.classList.add("turning");
    leaf.style.zIndex = 400;
    leaf.classList.remove("turn-fwd", "turn-back");
    leaf.classList.toggle("flipped", dir > 0);
    void leaf.offsetWidth;                                   // mulai ulang animasi
    leaf.classList.add(dir > 0 ? "turn-fwd" : "turn-back");
    leaf.addEventListener("animationend", () => {
      leaf.classList.remove("turning", "turn-fwd", "turn-back");
      applyZ(leaf, j);
    }, { once: true });
  }

  function goTo(target) {
    const E = entries.length;
    if (mq.matches) {
      pos = clamp(target, 0, E - 1);
      renderMobile();
      afterMove(0);
      return;
    }
    target = clamp(target, 0, E);
    if (target === pos) return;
    const dir = target > pos ? 1 : -1;
    const order = [];
    if (dir > 0) for (let j = pos; j < target; j++) order.push(j);
    else for (let j = pos - 1; j >= target; j--) order.push(j);
    pos = target;
    $$(".front", els.book).forEach((f, j) => { f.inert = j !== pos; });
    if (baseRight) baseRight.inert = pos !== E;
    order.forEach((j, k) => setTimeout(() => animateLeaf(leaves[j], j, dir), k * 130));
    afterMove(order.length * 130 + 1000);
  }

  function afterMove(delay) {
    updatePager();
    clearTimeout(lensTimer);
    lensTimer = setTimeout(() => lensRefresh(true), delay);
  }

  function updatePager() {
    const E = entries.length;
    const max = mq.matches ? E - 1 : E;
    els.prev.disabled = pos <= 0;
    els.next.disabled = pos >= max;
    els.label.textContent = pos < E ? `Lembar ${pos + 1} dari ${E}` : "Penutup";
  }

  /* --- satu lembar tegak (layar sempit) --- */
  function renderMobile() {
    const host = els.mobile;
    host.innerHTML = "";
    const e = entries[clamp(pos, 0, entries.length - 1)];
    host.append(makePlate(e, pos), makeInfo(e));
  }

  function render() {
    pos = 0;
    if (mq.matches) { els.book.innerHTML = ""; leaves = []; baseRight = null; renderMobile(); }
    else { els.mobile.innerHTML = ""; buildBook(); }
    renderToc();
    updatePager();
    lensRefresh(true);
  }

  /* --- filter & daftar isi --- */
  function buildFilters() {
    const defs = [["all", "Semua"], ...Object.entries(GROUPS).map(([k, g]) => [k, g.label])];
    defs.forEach(([key, text]) => {
      const b = el("button", "", text);
      b.type = "button";
      b.setAttribute("aria-pressed", String(key === filter));
      b.addEventListener("click", () => {
        filter = key;
        $$("button", els.filters).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        entries = key === "all" ? QARI.slice() : QARI.filter((q) => q.groups.includes(key));
        render();
      });
      els.filters.append(b);
    });
  }

  function renderToc() {
    els.toc.innerHTML = "";
    entries.forEach((e, i) => {
      const li = el("li");
      const b = el("button");
      b.type = "button";
      const tags = e.groups.map((g) => `<span class="tag ${g}">${GROUPS[g].short}</span>`).join("");
      b.innerHTML = `
        <span class="row"><span class="t">${e.name}</span><span class="lead"></span><span class="n">${i + 1}</span></span>
        <span class="meta">${tags}<span>${e.origin}</span></span>`;
      b.addEventListener("click", () => {
        goTo(i);
        els.stage.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      li.append(b);
      els.toc.append(li);
    });
  }

  els.prev.addEventListener("click", () => goTo(pos - 1));
  els.next.addEventListener("click", () => goTo(pos + 1));
  document.addEventListener("keydown", (ev) => {
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName)) return;
    const mid = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    if (mid && mid.closest("#baca")) return;          // panah dipakai oleh mushaf di bagian baca
    if (ev.key === "ArrowRight") goTo(pos + 1);
    if (ev.key === "ArrowLeft") goTo(pos - 1);
  });
  let touchX = null;
  els.mobile.addEventListener("touchstart", (ev) => { touchX = ev.touches[0].clientX; }, { passive: true });
  els.mobile.addEventListener("touchend", (ev) => {
    if (touchX == null) return;
    const dx = ev.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 60) goTo(pos + (dx < 0 ? 1 : -1));
  });
  mq.addEventListener("change", render);

  /* ---------- 4) kaca pembesar ---------- */
  const lens = { on: false, zoom: 2, x: 0, y: 0, target: null, wrap: null };
  const ZOOMS = [1.5, 2, 2.5, 3];

  function lensHost() { return mq.matches ? els.mobile : els.book; }

  function lensCandidates() {
    if (mq.matches) return [...els.mobile.children];
    const list = [];
    const left = $(`[data-plate="${pos}"]`, els.book);
    if (left) list.push(left);
    const right = pos < entries.length ? $(".info", leaves[pos]) : $(".close", els.book);
    if (right) list.push(right);
    return list;
  }

  function lensRefresh(force) {
    if (!lens.on) return;
    const R = els.lens.offsetWidth / 2;
    const st = els.stage.getBoundingClientRect();
    const host = lensHost();
    const hr = host.getBoundingClientRect();
    const cx = st.left + lens.x;
    const cy = st.top + lens.y;
    const target = lensCandidates().find((n) => {
      const r = n.getBoundingClientRect();
      return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
    }) || null;

    if (force || target !== lens.target) {
      lens.target = target;
      els.lensGlass.innerHTML = "";
      lens.wrap = null;
      if (target) {
        const tr = target.getBoundingClientRect();
        const wrapCls = mq.matches ? host.className : host.className.replace(/\bbook\b/, "").trim();
        const wrap = el("div", wrapCls + " lens-scale");
        wrap.style.width = host.clientWidth + "px";
        wrap.style.height = host.clientHeight + "px";
        const clone = target.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.inert = true;
        Object.assign(clone.style, {
          position: "absolute", inset: "auto", left: (tr.left - hr.left) + "px", top: (tr.top - hr.top) + "px",
          width: tr.width + "px", height: tr.height + "px", margin: "0"
        });
        wrap.append(clone);
        els.lensGlass.append(wrap);
        lens.wrap = wrap;
      }
    }
    if (lens.wrap) {
      const relX = cx - hr.left;
      const relY = cy - hr.top;
      lens.wrap.style.transform =
        `translate(${R - relX * lens.zoom}px, ${R - relY * lens.zoom}px) scale(${lens.zoom})`;
    }
  }

  function lensPlace() {
    const R = els.lens.offsetWidth / 2;
    const st = els.stage.getBoundingClientRect();
    lens.x = clamp(lens.x, 0, st.width);
    lens.y = clamp(lens.y, 0, st.height);
    els.lens.style.transform = `translate(${lens.x - R}px, ${lens.y - R}px)`;
  }

  function setZoom(z) {
    lens.zoom = clamp(z, ZOOMS[0], ZOOMS[ZOOMS.length - 1]);
    els.zoomVal.textContent = String(lens.zoom).replace(".", ",") + "×";
    els.zoomIn.disabled = !lens.on || lens.zoom >= ZOOMS[ZOOMS.length - 1];
    els.zoomOut.disabled = !lens.on || lens.zoom <= ZOOMS[0];
    lensRefresh(false);
  }

  els.lensToggle.addEventListener("click", () => {
    lens.on = !lens.on;
    els.lensToggle.setAttribute("aria-pressed", String(lens.on));
    els.lens.hidden = !lens.on;
    if (lens.on) {
      const st = els.stage.getBoundingClientRect();
      lens.x = st.width * (mq.matches ? .5 : .27);
      lens.y = st.height * (mq.matches ? .3 : .42);
      lensPlace();
      lensRefresh(true);
    } else {
      els.lensGlass.innerHTML = "";
      lens.wrap = null; lens.target = null;
    }
    setZoom(lens.zoom);
  });
  els.zoomIn.addEventListener("click", () => setZoom(ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(lens.zoom) + 1)]));
  els.zoomOut.addEventListener("click", () => setZoom(ZOOMS[Math.max(0, ZOOMS.indexOf(lens.zoom) - 1)]));

  let drag = null;
  els.lens.addEventListener("pointerdown", (ev) => {
    const st = els.stage.getBoundingClientRect();
    drag = { dx: ev.clientX - st.left - lens.x, dy: ev.clientY - st.top - lens.y };
    els.lens.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  });
  els.lens.addEventListener("pointermove", (ev) => {
    if (!drag) return;
    const st = els.stage.getBoundingClientRect();
    lens.x = ev.clientX - st.left - drag.dx;
    lens.y = ev.clientY - st.top - drag.dy;
    lensPlace();
    lensRefresh(false);
  });
  const endDrag = () => { drag = null; };
  els.lens.addEventListener("pointerup", endDrag);
  els.lens.addEventListener("pointercancel", endDrag);
  els.lens.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    setZoom(lens.zoom + (ev.deltaY < 0 ? .5 : -.5));
  }, { passive: false });
  els.lens.tabIndex = 0;
  els.lens.setAttribute("role", "img");
  els.lens.setAttribute("aria-label", "Kaca pembesar. Geser dengan mouse, sentuhan, atau tombol panah.");
  els.lens.addEventListener("keydown", (ev) => {
    const step = ev.shiftKey ? 40 : 14;
    const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[ev.key];
    if (!mv) return;
    ev.preventDefault(); ev.stopPropagation();
    lens.x += mv[0]; lens.y += mv[1];
    lensPlace();
    lensRefresh(false);
  });
  window.addEventListener("resize", () => { if (lens.on) { lensPlace(); lensRefresh(true); } });

  /* ---------- 5) pemutar ---------- */
  const audio = els.audio;
  const ui = {
    badge: $("#npBadge"), title: $("#npTitle"), sub: $("#npSub"),
    play: $("#playBtn"), icon: $("#playIcon"), prev: $("#prevBtn"), next: $("#nextBtn"),
    seek: $("#seek"), cur: $("#tCur"), dur: $("#tDur"),
    speed: $("#speed"), repeat: $("#repeatBtn"), vol: $("#vol")
  };
  const ICON_PLAY = '<path d="M8 5v14l11-7z" fill="currentColor"/>';
  const ICON_PAUSE = '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>';
  let now = null;                // { e, ri, surah, src }
  let seeking = false;

  function setStatus(text, isError) {
    ui.sub.textContent = text;
    ui.sub.classList.toggle("err", !!isError);
  }

  function describe() {
    const { e, ri, surah, src } = now;
    ui.badge.textContent = e.code;
    ui.badge.style.background = e.palette.paper;
    ui.badge.style.color = e.palette.accent;
    ui.title.textContent = `${SURAH[surah - 1]} · ${e.dynamic && src.reciter ? src.reciter : e.name}`;
    setStatus(e.readings[ri].label);
    ui.play.disabled = false;
    ui.prev.disabled = false;
    ui.next.disabled = false;
    ui.seek.disabled = false;
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: SURAH[surah - 1], artist: e.dynamic && src.reciter ? src.reciter : e.name, album: e.readings[ri].label
      });
    }
  }

  async function play(e, ri, surah) {
    setStatus("Memuat audio…");
    ui.title.textContent = `${SURAH[surah - 1]} · ${e.name}`;
    const src = await resolveReading(e, ri);
    if (!src) {
      setStatus("Katalog audio belum termuat. Periksa koneksi internet, lalu coba lagi.", true);
      showNotice(true);
      return;
    }
    if (src.missing) {
      setStatus(`Rekaman ${e.readings[ri].label} tidak ditemukan di katalog.`, true);
      return;
    }
    if (src.surahs && src.surahs.length && !src.surahs.includes(surah)) {
      setStatus(`${SURAH[surah - 1]} belum tersedia untuk riwayat ini.`, true);
      return;
    }
    now = { e, ri, surah, src };
    if (e.dynamic && src.reciter) { e.reciterName = src.reciter; refreshUI(); }
    audio.src = src.server + pad3(surah) + ".mp3";
    audio.playbackRate = +ui.speed.value;
    describe();
    try { await audio.play(); }
    catch (err) { if (err.name !== "AbortError") setStatus("Pemutaran diblokir atau gagal. Tekan tombol putar.", true); }
  }

  function stepSurah(dir) {
    if (!now) return;
    const list = now.src.surahs && now.src.surahs.length ? new Set(now.src.surahs) : null;
    let s = now.surah + dir;
    while (s >= 1 && s <= 114 && list && !list.has(s)) s += dir;
    if (s < 1 || s > 114) return;
    getSel(now.e).surah = s;
    play(now.e, now.ri, s);
    $$(`.info[data-entry="${now.e.id}"] .surah-select`).forEach((n) => { n.value = s; });
  }

  ui.play.addEventListener("click", () => { if (audio.paused) audio.play(); else audio.pause(); });
  ui.prev.addEventListener("click", () => stepSurah(-1));
  ui.next.addEventListener("click", () => stepSurah(1));
  ui.speed.addEventListener("change", () => { audio.playbackRate = +ui.speed.value; });
  ui.vol.addEventListener("input", () => { audio.volume = +ui.vol.value; });
  ui.repeat.addEventListener("click", () => {
    const on = ui.repeat.getAttribute("aria-pressed") !== "true";
    ui.repeat.setAttribute("aria-pressed", String(on));
    audio.loop = on;
  });
  ui.seek.addEventListener("input", () => {
    seeking = true;
    if (isFinite(audio.duration)) ui.cur.textContent = fmtTime(audio.duration * ui.seek.value / 1000);
  });
  ui.seek.addEventListener("change", () => {
    if (isFinite(audio.duration)) audio.currentTime = audio.duration * ui.seek.value / 1000;
    seeking = false;
  });

  audio.volume = +ui.vol.value;
  audio.addEventListener("play", () => {
    ui.icon.innerHTML = ICON_PAUSE; ui.play.setAttribute("aria-label", "Jeda");
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
  });
  audio.addEventListener("pause", () => {
    ui.icon.innerHTML = ICON_PLAY; ui.play.setAttribute("aria-label", "Putar");
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
  });
  audio.addEventListener("timeupdate", () => {
    if (seeking) return;
    ui.cur.textContent = fmtTime(audio.currentTime);
    ui.seek.value = isFinite(audio.duration) && audio.duration ? Math.round(audio.currentTime / audio.duration * 1000) : 0;
  });
  audio.addEventListener("loadedmetadata", () => { ui.dur.textContent = fmtTime(audio.duration); });
  audio.addEventListener("waiting", () => { if (now) setStatus("Memuat audio…"); });
  audio.addEventListener("playing", () => { if (now) setStatus(now.e.readings[now.ri].label); });
  audio.addEventListener("ended", () => { if (!audio.loop) stepSurah(1); });
  audio.addEventListener("error", () => {
    if (!audio.getAttribute("src")) return;
    setStatus("Berkas audio tidak bisa dimuat. Periksa koneksi, atau coba surah/riwayat lain.", true);
  });
  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("previoustrack", () => stepSurah(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => stepSurah(1));
  }

  function showNotice(show) {
    els.notice.hidden = !show;
    if (!show) return;
    els.notice.innerHTML = "<span>Katalog audio belum termuat. Periksa koneksi internet.</span>";
    const b = el("button", "btn ghost", "Coba lagi");
    b.type = "button";
    b.addEventListener("click", async () => {
      b.disabled = true;
      await resolveAll();
      refreshUI();
      showNotice(!catalog);
    });
    els.notice.append(b);
  }

  /* ---------- 6) kajian ---------- */
  const yt = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  const dialog = $("#clipDialog");
  const frame = $("#clipFrame");

  function openClip(video) {
    $("#clipTitle").textContent = `${video.title} — ${video.ustadz}`;
    const q = new URLSearchParams({ rel: "0" });
    if (video.start) q.set("start", String(video.start));
    if (video.end) q.set("end", String(video.end));
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}?${q}`;
    dialog.showModal();
  }
  dialog.addEventListener("close", () => { frame.src = "about:blank"; });

  function renderKajian() {
    const host = $("#notes");
    KAJIAN.forEach((k) => {
      const a = el("article", "note");
      a.innerHTML = `<h3>${k.title}</h3><p>${k.blurb}</p>`;
      if (k.video) {
        const v = k.video;
        const play = el("button", "video-card");
        play.type = "button";
        play.setAttribute("aria-label", `Putar video: ${v.title} — ${v.ustadz}`);
        play.innerHTML = `
          <img src="https://i.ytimg.com/vi/${encodeURIComponent(v.youtubeId)}/hqdefault.jpg" alt="" loading="lazy">
          <span class="vc-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
          </span>
          <span class="vc-text"><strong>${v.title}</strong><span>${v.ustadz}</span></span>`;
        play.addEventListener("click", () => openClip(v));
        a.append(play);
      }
      const ul = el("ul", "find");
      const lbl = el("p", "lbl", "Cari kajian lain di YouTube");
      k.ustadz.forEach((u) => {
        const li = el("li");
        const link = el("a");
        link.href = yt(`${k.query} ${u}`);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = u;
        li.append(link);
        ul.append(li);
      });
      a.append(lbl, ul);
      if (k.clips && k.clips.length) {
        const cl = el("ul", "clips");
        k.clips.forEach((c) => {
          const li = el("li");
          const b = el("button");
          b.type = "button";
          b.textContent = `Putar: ${c.title} (${c.ustadz})`;
          b.addEventListener("click", () => openClip(c));
          li.append(b);
          cl.append(li);
        });
        a.append(cl);
      }
      host.append(a);
    });
  }


  /* ---------- 6b) baca Al-Qur'an (30 juz) ---------- */
  const SLIDE_SIZE = 5;   // jumlah ayat per kartu geser
  const rd = { mode: "juz", juz: 1, surah: 1, tr: true, latin: false, size: 2.1, token: 0, data: [], slides: [], slide: 0 };
  const rEl = {
    bar: $("#readerBar"), juzGrid: $("#juzPick"), surahBox: $("#surahPick"), surahSel: $("#surahSelect"),
    range: $("#readerRange"), box: $("#reader"), prev: $("#rPrev"), next: $("#rNext"),
    slidePrev: $("#slidePrev"), slideNext: $("#slideNext"), slideCount: $("#slideCount"),
    modeJuz: $("#modeJuz"), modeSurah: $("#modeSurah"), tr: $("#optTr"), latin: $("#optLatin"),
    minus: $("#fsMinus"), plus: $("#fsPlus")
  };
  const chapterCache = new Map();
  // teks sumber memakai U+065E untuk tanwin dhammah (tidak ada di font) dan satu spasi tipis di 2:72
  const cleanText = (t) => String(t).replace(/\u065E/g, "\u064C").replace(/\u2009/g, "");
  const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  const BISMILLAH = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ";

  function loadChapter(n) {
    if (!chapterCache.has(n)) {
      chapterCache.set(n, fetch(`${QURAN_TEXT_BASE}/${n}.json`)
        .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .catch((err) => { chapterCache.delete(n); throw err; }));
    }
    return chapterCache.get(n);
  }

  function juzRange(j) {
    const from = JUZ_START[j - 1];
    let to;
    if (j === 30) to = { s: 114, a: AYAH_COUNT[113] };
    else {
      const nx = JUZ_START[j];
      to = nx.a > 1 ? { s: nx.s, a: nx.a - 1 } : { s: nx.s - 1, a: AYAH_COUNT[nx.s - 2] };
    }
    return { from, to };
  }
  const surahRange = (s) => ({ from: { s, a: 1 }, to: { s, a: AYAH_COUNT[s - 1] } });

  function segmentsFor(range) {
    const segs = [];
    for (let s = range.from.s; s <= range.to.s; s++) {
      segs.push({
        s,
        a1: s === range.from.s ? range.from.a : 1,
        a2: s === range.to.s ? range.to.a : AYAH_COUNT[s - 1]
      });
    }
    return segs;
  }
  const countAyat = (segs) => segs.reduce((t, g) => t + (g.a2 - g.a1 + 1), 0);
  const refText = (p) => `${SURAH[p.s - 1]} ${p.a}`;

  function currentRange() { return rd.mode === "juz" ? juzRange(rd.juz) : surahRange(rd.surah); }

  async function showReader() {
    const my = ++rd.token;
    const range = currentRange();
    const segs = segmentsFor(range);
    rEl.range.textContent = (rd.mode === "juz" ? `Juz ${rd.juz} · ` : "") +
      `${refText(range.from)} – ${refText(range.to)} · ${countAyat(segs)} ayat`;
    rEl.box.setAttribute("aria-busy", "true");
    rEl.box.innerHTML = '<p class="loading">Memuat teks…</p>';
    updateReaderNav();
    try {
      const chapters = await Promise.all(segs.map((g) => loadChapter(g.s)));
      if (my !== rd.token) return;                 // pengguna sudah pindah pilihan
      rd.data = segs.map((g, i) => ({ ...g, ch: chapters[i] }));
      rd.slides = buildSlides(rd.data);
      rd.slide = 0;
      renderSlide(0);
    } catch (err) {
      if (my !== rd.token) return;
      console.warn("Teks Al-Qur'an gagal dimuat:", err);
      rd.slides = [];
      rEl.box.innerHTML = "";
      const p = el("p", "loading err", "Teks belum bisa dimuat. Periksa koneksi internet. ");
      const b = el("button", "btn-line", "Coba lagi");
      b.type = "button";
      b.addEventListener("click", showReader);
      p.append(b);
      rEl.box.append(p);
      updateSlideNav();
    } finally {
      if (my === rd.token) rEl.box.removeAttribute("aria-busy");
    }
  }

  /* Memecah rentang ayat menjadi kartu-kartu kecil (SLIDE_SIZE ayat per kartu) supaya halaman
     tidak memanjang ke bawah; navigasi antar kartu memakai tombol/geser horizontal. */
  function buildSlides(data) {
    const slides = [];
    data.forEach((seg) => {
      const ch = seg.ch;
      const verses = ch.verses.filter((v) => v.id >= seg.a1 && v.id <= seg.a2);
      for (let i = 0; i < verses.length; i += SLIDE_SIZE) {
        slides.push({
          ch, seg,
          verses: verses.slice(i, i + SLIDE_SIZE),
          showHeader: i === 0,
          showBismillah: i === 0 && seg.a1 === 1 && ch.id !== 1 && ch.id !== 9
        });
      }
    });
    return slides.length ? slides : [null];
  }

  function renderSlideContent(sl) {
    const blocks = rd.tr || rd.latin;
    rEl.box.className = "reader" + (blocks ? "" : " flow");
    rEl.box.style.setProperty("--ar-size", rd.size + "rem");
    rEl.box.innerHTML = "";
    if (!sl) { rEl.box.innerHTML = '<p class="loading">Tidak ada ayat untuk ditampilkan.</p>'; return; }
    const { ch, seg, verses } = sl;
    const sec = el("section", "sura");
    if (sl.showHeader) {
      const head = el("header", "sura-head");
      head.append(el("p", "sh-ar"));
      $(".sh-ar", head).textContent = "سورة " + ch.name;
      $(".sh-ar", head).lang = "ar";
      const h3 = el("h3");
      h3.textContent = `${ch.id}. ${ch.transliteration}`;
      const partial = seg.a1 !== 1 || seg.a2 !== ch.total_verses;
      const meta = el("p", "sh-meta");
      meta.textContent = `${ch.translation} · ${ch.type === "meccan" ? "Makkiyah" : "Madaniyah"} · ${ch.total_verses} ayat` +
        (partial ? ` · ditampilkan ayat ${seg.a1}–${seg.a2}` : "");
      const listen = el("button", "btn-mini", "Putar murottal");
      listen.type = "button";
      listen.setAttribute("aria-label", `Putar murottal surah ${ch.transliteration}`);
      listen.addEventListener("click", () => play(QARI[0], 0, ch.id));
      head.append(h3, meta, listen);
      sec.append(head);
    } else {
      const cont = el("p", "sura-cont");
      cont.textContent = `${ch.transliteration} · lanjutan, ayat ${verses[0].id}–${verses[verses.length - 1].id}`;
      sec.append(cont);
    }

    if (sl.showBismillah) {
      const b = el("p", "bismillah");
      b.lang = "ar"; b.dir = "rtl"; b.textContent = BISMILLAH;
      sec.append(b);
    }

    if (!blocks) {
      const p = el("p", "ar flow-p");
      p.lang = "ar"; p.dir = "rtl";
      verses.forEach((v) => {
        p.append(document.createTextNode(cleanText(v.text) + " "));
        const n = el("span", "an"); n.textContent = toArabicDigits(v.id);
        p.append(n, document.createTextNode(" "));
      });
      sec.append(p);
    } else {
      verses.forEach((v) => {
        const art = el("article", "ayat");
        const ar = el("p", "ar");
        ar.lang = "ar"; ar.dir = "rtl";
        ar.append(document.createTextNode(cleanText(v.text) + " "));
        const n = el("span", "an"); n.textContent = toArabicDigits(v.id);
        ar.append(n);
        art.append(ar);
        if (rd.latin && v.transliteration) {
          const l = el("p", "latin"); l.textContent = v.transliteration;
          art.append(l);
        }
        if (rd.tr && v.translation) {
          const t = el("p", "tr");
          const ref = el("span", "ref"); ref.textContent = `${ch.id}:${v.id}`;
          t.append(ref, document.createTextNode(" " + v.translation));
          art.append(t);
        }
        sec.append(art);
      });
    }
    rEl.box.append(sec);
  }

  function updateSlideNav() {
    const n = rd.slides.length;
    rEl.slideCount.textContent = n ? `Bagian ${rd.slide + 1} dari ${n}` : "";
    rEl.slidePrev.disabled = rd.slide <= 0;
    rEl.slideNext.disabled = rd.slide >= n - 1;
  }

  function renderSlide(i, dir) {
    rd.slide = clamp(i, 0, rd.slides.length - 1);
    renderSlideContent(rd.slides[rd.slide]);
    updateSlideNav();
    if (dir) {
      rEl.box.classList.remove("slide-in-l", "slide-in-r");
      void rEl.box.offsetWidth;
      rEl.box.classList.add(dir > 0 ? "slide-in-r" : "slide-in-l");
    }
    rEl.box.scrollTop = 0;
  }

  function stepSlide(dir) {
    const n = rd.slides.length;
    const target = rd.slide + dir;
    if (target < 0 || target >= n) return;
    renderSlide(target, dir);
  }

  function updateReaderNav() {
    const juz = rd.mode === "juz";
    const cur = juz ? rd.juz : rd.surah;
    const max = juz ? 30 : 114;
    rEl.prev.disabled = cur <= 1;
    rEl.next.disabled = cur >= max;
    rEl.prev.textContent = cur > 1 ? (juz ? `← Juz ${cur - 1}` : `← ${SURAH[cur - 2]}`) : "←";
    rEl.next.textContent = cur < max ? (juz ? `Juz ${cur + 1} →` : `${SURAH[cur]} →`) : "→";
    $$("button", rEl.juzGrid).forEach((b) => b.setAttribute("aria-pressed", String(juz && +b.dataset.juz === rd.juz)));
    rEl.surahSel.value = rd.surah;
  }

  function setMode(mode) {
    rd.mode = mode;
    rEl.modeJuz.setAttribute("aria-pressed", String(mode === "juz"));
    rEl.modeSurah.setAttribute("aria-pressed", String(mode === "surah"));
    rEl.juzGrid.hidden = mode !== "juz";
    rEl.surahBox.hidden = mode !== "surah";
    showReader();
  }
  function stepReader(dir) {
    if (rd.mode === "juz") rd.juz = clamp(rd.juz + dir, 1, 30);
    else rd.surah = clamp(rd.surah + dir, 1, 114);
    showReader();
    rEl.bar.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initReader() {
    for (let j = 1; j <= 30; j++) {
      const b = el("button", "", String(j));
      b.type = "button";
      b.dataset.juz = j;
      const r = juzRange(j);
      b.title = `Juz ${j}: ${refText(r.from)} – ${refText(r.to)}`;
      b.setAttribute("aria-label", `Juz ${j}`);
      b.addEventListener("click", () => { rd.juz = j; showReader(); });
      rEl.juzGrid.append(b);
    }
    SURAH.forEach((n, i) => rEl.surahSel.append(new Option(`${i + 1}. ${n} (${AYAH_COUNT[i]} ayat)`, i + 1)));
    rEl.surahSel.addEventListener("change", () => { rd.surah = +rEl.surahSel.value; showReader(); });
    rEl.modeJuz.addEventListener("click", () => setMode("juz"));
    rEl.modeSurah.addEventListener("click", () => setMode("surah"));
    rEl.prev.addEventListener("click", () => stepReader(-1));
    rEl.next.addEventListener("click", () => stepReader(1));
    rEl.tr.addEventListener("change", () => { rd.tr = rEl.tr.checked; if (rd.slides.length) renderSlideContent(rd.slides[rd.slide]); });
    rEl.latin.addEventListener("change", () => { rd.latin = rEl.latin.checked; if (rd.slides.length) renderSlideContent(rd.slides[rd.slide]); });
    const size = (d) => {
      rd.size = clamp(Math.round((rd.size + d) * 10) / 10, 1.4, 3.4);
      rEl.box.style.setProperty("--ar-size", rd.size + "rem");
      rEl.minus.disabled = rd.size <= 1.4;
      rEl.plus.disabled = rd.size >= 3.4;
    };
    rEl.minus.addEventListener("click", () => size(-.2));
    rEl.plus.addEventListener("click", () => size(.2));

    rEl.slidePrev.addEventListener("click", () => stepSlide(-1));
    rEl.slideNext.addEventListener("click", () => stepSlide(1));
    let tX = null;
    rEl.box.addEventListener("touchstart", (ev) => { tX = ev.touches[0].clientX; }, { passive: true });
    rEl.box.addEventListener("touchend", (ev) => {
      if (tX == null) return;
      const dx = ev.changedTouches[0].clientX - tX;
      tX = null;
      if (Math.abs(dx) > 50) stepSlide(dx < 0 ? 1 : -1);
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName)) return;
      const mid = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      if (!(mid && mid.closest("#baca"))) return;
      if (mid.closest("#mushafView") && !mid.closest("#textView")) return;   // biar tak bentrok dgn mushaf
      if (ev.key === "ArrowRight") stepSlide(1);
      if (ev.key === "ArrowLeft") stepSlide(-1);
    });

    // teks baru diunduh saat bagian ini hampir terlihat, supaya halaman awal tetap ringan
    updateReaderNav();
    const first = currentRange();
    rEl.range.textContent = `Juz 1 · ${refText(first.from)} – ${refText(first.to)}`;
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) { io.disconnect(); showReader(); }
      }, { rootMargin: "600px 0px" });
      io.observe($("#baca"));
    } else {
      showReader();
    }
  }

  // dipakai oleh js/mushaf.js
  window.TD = {
    loadChapter,
    toArabicDigits,
    cleanText,
    BISMILLAH,
    playSurah: (n) => play(QARI[0], 0, n),
    textPosition: () => ({ mode: rd.mode, juz: rd.juz, surah: rd.surah })
  };

  /* ---------- 7) mulai ---------- */
  buildFilters();
  render();
  renderKajian();
  initReader();
  resolveAll().then(() => { refreshUI(); showNotice(!catalog); });

})();
