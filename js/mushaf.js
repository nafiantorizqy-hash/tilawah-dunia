"use strict";

/* ==========================================================================
   Mushaf Madinah 3D — 604 halaman, dibaca dari kanan ke kiri, tanpa terjemah.
   Bagian: 1) data halaman  2) isi & ukuran huruf per halaman  3) buku 3D
           4) tampilan HP  5) kontrol  6) pemilih tampilan
   Bergantung pada js/data.js dan js/app.js (window.TD).
   ========================================================================== */
(() => {
  const TD = window.TD;
  if (!TD) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const N_PAGES = PAGE_START.length;          // 604
  const N_LEAVES = Math.ceil(N_PAGES / 2);    // 302 lembar (tiap lembar = 2 halaman)
  const DW = 520, DH = 740;                   // ukuran rancangan satu halaman (piksel), lalu diskalakan

  /* ---------- 1) data halaman ---------- */
  const PREFIX = [];
  let acc = 0;
  AYAH_COUNT.forEach((c) => { PREFIX.push(acc); acc += c; });
  const absIdx = (s, a) => PREFIX[s - 1] + a;
  const PAGE_ABS = PAGE_START.map(([s, a]) => absIdx(s, a));
  const JUZ_ABS = JUZ_START.map(({ s, a }) => absIdx(s, a));
  const countLE = (arr, v) => {                // banyaknya elemen <= v (arr terurut)
    let lo = 0, hi = arr.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid] <= v) lo = mid + 1; else hi = mid; }
    return lo;
  };
  const pageOf = (s, a) => countLE(PAGE_ABS, absIdx(s, a));
  // juz sebuah halaman = juz ayat terakhirnya (beberapa juz dimulai di tengah halaman, mis. juz 7 di hlm. 121)
  const juzOfPage = (p) => countLE(JUZ_ABS, p < N_PAGES ? PAGE_ABS[p] - 1 : 6236);

  function pageSegments(p) {
    const [s0, a0] = PAGE_START[p - 1];
    let s1, a1;
    if (p < N_PAGES) {
      const [ns, na] = PAGE_START[p];
      if (na > 1) { s1 = ns; a1 = na - 1; } else { s1 = ns - 1; a1 = AYAH_COUNT[ns - 2]; }
    } else { s1 = 114; a1 = AYAH_COUNT[113]; }
    const segs = [];
    for (let s = s0; s <= s1; s++) {
      segs.push({ s, a1: s === s0 ? a0 : 1, a2: s === s1 ? a1 : AYAH_COUNT[s - 1] });
    }
    return segs;
  }

  /* ---------- 2) isi & ukuran huruf per halaman ---------- */
  const fitCache = new Map();                  // nomor halaman -> { size, center, fill }
  const fontsReady = (document.fonts && document.fonts.load)
    ? document.fonts.load('24px "Amiri Quran"', "بسم").catch(() => {}) : Promise.resolve();

  function makeMPage(p) {
    const root = el("div", "mp");
    root.dataset.page = p;
    root.lang = "ar";
    const scale = el("div", "mp-scale");
    const frame = el("div", "mp-frame");
    const head = el("div", "mp-head");
    const juzEl = el("span", "mp-juz");
    juzEl.textContent = "الجزء " + TD.toArabicDigits(juzOfPage(p));
    const suraEl = el("span", "mp-sura");
    head.append(juzEl, suraEl);
    const body = el("div", "mp-body");
    body.dir = "rtl";
    const flow = el("div", "mp-flow");
    flow.append(el("p", "mp-wait", "…"));
    body.append(flow);
    const foot = el("div", "mp-foot");
    const num = el("span");
    num.textContent = TD.toArabicDigits(p);
    foot.append(num);
    frame.append(head, body, foot);
    scale.append(frame);
    root.append(scale);

    const segs = pageSegments(p);
    Promise.all([...segs.map((g) => TD.loadChapter(g.s)), fontsReady]).then((res) => {
      const chs = res.slice(0, segs.length);
      suraEl.textContent = chs[0].name;
      if (root.isConnected) fillPage(root, body, flow, segs, chs, p);
      else root.dataset.pending = "1";           // diisi nanti saat sudah terpasang
      root._fill = () => fillPage(root, body, flow, segs, chs, p);
    }).catch(() => {
      flow.innerHTML = "";
      const m = el("p", "mp-wait", "Teks belum termuat.");
      m.dir = "ltr";
      flow.append(m);
    });
    return root;
  }

  function fillPage(root, body, flow, segs, chs, p) {
    if (!body.clientHeight) { root.dataset.pending = "1"; return; }   // wadah tersembunyi: ukur nanti
    flow.innerHTML = "";
    segs.forEach((g, i) => {
      const ch = chs[i];
      if (g.a1 === 1) {
        const banner = el("div", "mp-banner");
        banner.textContent = "سُورَةُ " + ch.name;
        flow.append(banner);
        if (ch.id !== 1 && ch.id !== 9) {
          const b = el("p", "mp-bism");
          b.textContent = TD.BISMILLAH;
          flow.append(b);
        }
      }
      const para = el("p", "mp-text");
      ch.verses.filter((v) => v.id >= g.a1 && v.id <= g.a2).forEach((v) => {
        para.append(document.createTextNode(TD.cleanText(v.text) + " "));
        const n = el("span", "an");
        n.textContent = TD.toArabicDigits(v.id);
        para.append(n, document.createTextNode(" "));
      });
      flow.append(para);
    });

    const last = segs[segs.length - 1];
    const fullPage = last.a2 < AYAH_COUNT[last.s - 1];      // halaman berakhir di tengah surah
    const lastPara = flow.querySelector(".mp-text:last-of-type");
    const cached = fitCache.get(p);
    if (cached) {
      body.style.fontSize = cached.size + "px";
      body.style.justifyContent = cached.center ? "center" : "flex-start";
      if (fullPage && cached.fill && lastPara) lastPara.classList.add("fill");
      return;
    }
    // cari ukuran huruf terbesar yang masih muat dalam kotak halaman
    let lo = 14, hi = 25, best = lo;
    while (hi - lo > 0.4) {
      const mid = (lo + hi) / 2;
      body.style.fontSize = mid + "px";
      if (flow.offsetHeight <= body.clientHeight) { best = mid; lo = mid; } else hi = mid;
    }
    body.style.fontSize = best + "px";
    const center = flow.offsetHeight < body.clientHeight * 0.82;
    body.style.justifyContent = center ? "center" : "flex-start";

    // baris terakhir diratakan kiri-kanan hanya bila cukup penuh (seperti mushaf cetak)
    let fill = false;
    if (fullPage && lastPara) {
      try {
        const r = document.createRange();
        r.selectNodeContents(lastPara);
        const rects = [...r.getClientRects()].filter((x) => x.width > 1);
        const bottom = Math.max(...rects.map((x) => x.bottom));
        const used = rects.filter((x) => Math.abs(x.bottom - bottom) < 4).reduce((t, x) => t + x.width, 0);
        fill = used / lastPara.clientWidth >= 0.6;
        if (fill) lastPara.classList.add("fill");
      } catch (e) { /* biarkan rata tengah */ }
    }
    fitCache.set(p, { size: best, center, fill });
  }

  /* ---------- 3) buku 3D (layar lebar) ---------- */
  const mq = window.matchMedia("(max-width: 899px)");
  const els = {
    view: $("#mushafView"), stage: $("#mStage"), book: $("#mBook"), mobile: $("#mMobile"),
    prev: $("#mPrev"), next: $("#mNext"), label: $("#mLabel"),
    juz: $("#mJuz"), surah: $("#mSurah"), page: $("#mPage"), go: $("#mGo"), full: $("#mFull")
  };
  const st = { page: 1, spread: 0, busy: false, inited: false };
  const leaves = new Map();
  let baseL = null, baseR = null, stackL = null, stackR = null;

  function buildBook() {
    els.book.innerHTML = "";
    leaves.clear();
    stackL = el("div", "mstack l");
    stackR = el("div", "mstack r");
    baseR = el("div", "mbase r");
    baseR.append(el("div", "cover-in"));
    baseL = el("div", "mbase l");
    const end = el("div", "end-page");
    const ar = el("p");
    ar.lang = "ar"; ar.dir = "rtl";
    ar.textContent = "صَدَقَ ٱللَّهُ ٱلۡعَظِيمُ";
    end.append(ar);
    baseL.append(end);
    els.book.append(stackL, stackR, baseR, baseL);
    ensureLeaves();
    syncLeaves();
    fitScale();
  }

  function createLeaf(j) {
    const leaf = el("div", "mleaf");
    leaf.dataset.j = j;
    const front = el("div", "mface front");
    front.append(makeMPage(2 * j + 1));
    const back = el("div", "mface back");
    if (2 * j + 2 <= N_PAGES) back.append(makeMPage(2 * j + 2));
    leaf.append(front, back);
    els.book.append(leaf);
    leaves.set(j, leaf);
    requestAnimationFrame(() => {                 // isi halaman yang menunggu sampai terpasang
      leaf.querySelectorAll(".mp").forEach((mp) => { if (mp.dataset.pending && mp._fill) { delete mp.dataset.pending; mp._fill(); } });
    });
  }

  // hanya lembar di sekitar posisi sekarang yang dibuat, supaya 302 lembar tidak membebani browser
  function ensureLeaves() {
    const s = st.spread;
    for (let j = Math.max(0, s - 3); j <= Math.min(N_LEAVES - 1, s + 3); j++) {
      if (!leaves.has(j)) createLeaf(j);
    }
    leaves.forEach((leaf, j) => {
      if (j < s - 4 || j > s + 4) { leaf.remove(); leaves.delete(j); }
    });
  }

  function applyZ(leaf, j) {
    leaf.style.zIndex = j < st.spread ? j + 1 : N_LEAVES - j + 1;
  }

  function syncLeaves() {
    const s = st.spread;
    leaves.forEach((leaf, j) => {
      leaf.classList.toggle("flipped", j < s);
      applyZ(leaf, j);
    });
    const vis = new Set([2 * s, 2 * s + 1]);
    els.book.querySelectorAll(".mp").forEach((mp) => mp.setAttribute("aria-hidden", String(!vis.has(+mp.dataset.page))));
    // tebal tumpukan halaman di kiri dan kanan
    els.book.style.setProperty("--tl", (2 + 12 * (N_LEAVES - s) / N_LEAVES).toFixed(1) + "px");
    els.book.style.setProperty("--tr", (2 + 12 * s / N_LEAVES).toFixed(1) + "px");
  }

  function animateLeaf(leaf, j, dir) {
    leaf.classList.add("turning");
    leaf.style.zIndex = 400;
    leaf.classList.remove("turn-f", "turn-b");
    leaf.classList.toggle("flipped", dir > 0);
    void leaf.offsetWidth;
    leaf.classList.add(dir > 0 ? "turn-f" : "turn-b");
    const done = () => {
      leaf.classList.remove("turning", "turn-f", "turn-b");
      applyZ(leaf, j);
    };
    leaf.addEventListener("animationend", done, { once: true });
  }

  function stepTo(t) {
    const s = st.spread;
    const dir = t > s ? 1 : -1;
    const j = dir > 0 ? s : s - 1;
    st.spread = t;
    ensureLeaves();
    const leaf = leaves.get(j);
    if (leaf) animateLeaf(leaf, j, dir);
    st.busy = true;
    setTimeout(() => { st.busy = false; syncLeaves(); }, 950);
    chrome();
  }

  function moveSpread(t) {
    t = clamp(t, 0, N_LEAVES);
    const s = st.spread;
    if (t === s) return;
    if (Math.abs(t - s) > 1) {
      // lompatan jauh: pasang lembar di dekat tujuan, lalu satu lembar dibalik menuju tujuan
      st.spread = t > s ? t - 1 : t + 1;
      els.book.innerHTML = "";
      buildBook();
      requestAnimationFrame(() => requestAnimationFrame(() => stepTo(t)));
      return;
    }
    stepTo(t);
  }

  /* ---------- 4) satu halaman (layar sempit) ---------- */
  function renderMobile(dir) {
    els.mobile.innerHTML = "";
    const pg = makeMPage(st.page);
    els.mobile.append(pg);
    if (dir) pg.classList.add(dir > 0 ? "slide-next" : "slide-prev");
    fitScale();
    [st.page - 1, st.page + 1].forEach((p) => {  // muat teks halaman sebelah lebih dulu
      if (p >= 1 && p <= N_PAGES) pageSegments(p).forEach((g) => TD.loadChapter(g.s).catch(() => {}));
    });
    chrome();
  }

  function fitScale() {
    const desktop = !mq.matches;
    const box = desktop ? els.book : els.mobile;
    const w = box.clientWidth;
    if (!w) return;
    box.style.setProperty("--k", (desktop ? w / (DW * 2) : w / DW).toFixed(4));
  }

  /* ---------- 5) kontrol ---------- */
  function visiblePage() {
    if (mq.matches) return st.page;
    return st.spread === 0 ? 1 : Math.min(N_PAGES, 2 * st.spread);
  }

  function chrome() {
    const desktop = !mq.matches;
    let text;
    if (desktop) {
      const s = st.spread;
      st.page = visiblePage();
      text = s === 0 ? "Halaman 1" : (2 * s + 1 > N_PAGES ? `Halaman ${N_PAGES}` : `Halaman ${2 * s}–${2 * s + 1}`);
    } else {
      text = `Halaman ${st.page}`;
    }
    els.label.textContent = `${text} dari ${N_PAGES} · Juz ${juzOfPage(clamp(st.page, 1, N_PAGES))}`;
    els.page.value = st.page;
    els.juz.value = juzOfPage(st.page);
    els.surah.value = PAGE_START[st.page - 1][0];
    const atStart = desktop ? st.spread <= 0 : st.page <= 1;
    const atEnd = desktop ? st.spread >= N_LEAVES : st.page >= N_PAGES;
    els.prev.disabled = atStart;
    els.next.disabled = atEnd;
  }

  function showPage(p) {
    p = clamp(Math.round(+p) || 1, 1, N_PAGES);
    if (mq.matches) {
      const dir = p > st.page ? 1 : p < st.page ? -1 : 0;
      st.page = p;
      renderMobile(dir);
    } else {
      st.page = p;
      moveSpread(Math.floor(p / 2));
      chrome();
    }
  }

  function step(dir) {                            // dir > 0 = halaman berikutnya
    if (st.busy) return;
    if (mq.matches) showPage(st.page + dir);
    else moveSpread(st.spread + dir);
  }

  function render() {
    if (mq.matches) {
      els.book.innerHTML = ""; leaves.clear();
      renderMobile(0);
    } else {
      els.mobile.innerHTML = "";
      st.spread = Math.floor(st.page / 2);
      buildBook();
      chrome();
    }
  }

  function initControls() {
    for (let j = 1; j <= 30; j++) els.juz.append(new Option("Juz " + j, j));
    SURAH.forEach((n, i) => els.surah.append(new Option(`${i + 1}. ${n}`, i + 1)));
    els.juz.addEventListener("change", () => {
      const j = +els.juz.value;
      showPage(pageOf(JUZ_START[j - 1].s, JUZ_START[j - 1].a));
    });
    els.surah.addEventListener("change", () => showPage(pageOf(+els.surah.value, 1)));
    els.go.addEventListener("click", () => showPage(els.page.value));
    els.page.addEventListener("keydown", (ev) => { if (ev.key === "Enter") showPage(els.page.value); });
    els.prev.addEventListener("click", () => step(-1));
    els.next.addEventListener("click", () => step(1));

    // klik: halaman kiri = maju, halaman kanan = mundur (buku dibaca dari kanan ke kiri)
    let down = null;
    els.book.addEventListener("pointerdown", (ev) => { down = { x: ev.clientX, y: ev.clientY }; });
    els.book.addEventListener("click", (ev) => {
      if (down && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 6) return;
      if (String(window.getSelection()).length) return;
      const r = els.book.getBoundingClientRect();
      step(ev.clientX < r.left + r.width / 2 ? 1 : -1);
    });
    // geser di HP: ke kanan = halaman berikutnya
    let tx = null;
    els.mobile.addEventListener("touchstart", (ev) => { tx = ev.touches[0].clientX; }, { passive: true });
    els.mobile.addEventListener("touchend", (ev) => {
      if (tx == null) return;
      const dx = ev.changedTouches[0].clientX - tx;
      tx = null;
      if (Math.abs(dx) > 50) step(dx > 0 ? 1 : -1);
    });

    document.addEventListener("keydown", (ev) => {
      if (els.view.hidden || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName)) return;
      const inFull = document.fullscreenElement === els.stage;
      const mid = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      if (!inFull && !(mid && mid.closest("#baca"))) return;
      if (ev.key === "ArrowLeft") { ev.preventDefault(); step(1); }
      if (ev.key === "ArrowRight") { ev.preventDefault(); step(-1); }
    });

    if (document.fullscreenEnabled && els.stage.requestFullscreen) {
      els.full.hidden = false;
      els.full.addEventListener("click", () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else els.stage.requestFullscreen().catch(() => {});
      });
    }
    if ("ResizeObserver" in window) {
      new ResizeObserver(fitScale).observe(els.book);
      new ResizeObserver(fitScale).observe(els.mobile);
    } else {
      window.addEventListener("resize", fitScale);
    }
    mq.addEventListener("change", () => {
      if (!st.inited) return;
      if (els.view.hidden) st.dirty = true; else render();
    });
  }

  function flushPending() {
    document.querySelectorAll("#mushafView .mp[data-pending]").forEach((mp) => {
      if (mp._fill && mp.querySelector(".mp-body").clientHeight) { delete mp.dataset.pending; mp._fill(); }
    });
  }

  function initMushaf() {
    if (st.inited) return;
    st.inited = true;
    initControls();
    const p = TD.textPosition();
    st.page = p.mode === "juz" ? pageOf(JUZ_START[p.juz - 1].s, JUZ_START[p.juz - 1].a) : pageOf(p.surah, 1);
    render();
  }

  /* ---------- 6) pemilih tampilan ---------- */
  const btnText = $("#viewText");
  const btnMushaf = $("#viewMushaf");
  const textView = $("#textView");
  function setView(which) {
    const mushaf = which === "mushaf";
    btnText.setAttribute("aria-pressed", String(!mushaf));
    btnMushaf.setAttribute("aria-pressed", String(mushaf));
    textView.hidden = mushaf;
    els.view.hidden = !mushaf;
    if (mushaf) {
      initMushaf();
      if (st.dirty) { st.dirty = false; render(); }
      requestAnimationFrame(() => { fitScale(); flushPending(); });
    }
  }
  btnText.addEventListener("click", () => setView("text"));
  btnMushaf.addEventListener("click", () => setView("mushaf"));

  // untuk pengujian dan penggunaan dari konsol
  window.Mushaf = { showPage, step, pageOf, juzOfPage, pageSegments, fitCache, state: st, setView };
})();
