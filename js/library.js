"use strict";

/* ==========================================================================
   Perpustakaan Rujukan — rak buku 3D dengan CSS 3D transform (bukan WebGL).
   Memakai teknik yang sama dengan buku sketsa dan mushaf di situs ini:
   terbukti tampil konsisten di semua perangkat, tanpa risiko WebGL/driver.
   ========================================================================== */
(() => {
  const stage = document.getElementById("libStage");
  if (!stage) return;

  const track = document.getElementById("libTrack");
  const panel = document.getElementById("libPanel");
  const hint = document.getElementById("libHint");
  const books = (typeof LIBRARY_BOOKS !== "undefined") ? LIBRARY_BOOKS : [];

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  let openBook = null;

  function openPanel(book, cardEl) {
    document.getElementById("libField").textContent = book.field;
    document.getElementById("libBTitle").textContent = book.title;
    document.getElementById("libSub").textContent = book.subtitle || "";
    document.getElementById("libAuthors").textContent = book.authors;
    const meta = [book.year, book.pages, book.isbn ? "ISBN " + book.isbn : ""].filter(Boolean).join(" · ");
    document.getElementById("libMeta").textContent = meta;
    document.getElementById("libBlurb").textContent = book.blurb;
    document.getElementById("libLink").href = book.url;
    panel.hidden = false;
    hint.classList.add("dim");
    if (openBook && openBook !== cardEl) openBook.classList.remove("open");
    cardEl.classList.add("open");
    openBook = cardEl;
  }
  function closePanel() {
    panel.hidden = true;
    hint.classList.remove("dim");
    if (openBook) { openBook.classList.remove("open"); openBook = null; }
  }
  document.getElementById("libClose").addEventListener("click", closePanel);

  books.forEach((book, i) => {
    const card = el("div", "book3d");
    card.style.setProperty("--spine", book.spine || "#5c3a21");
    card.style.setProperty("--label", book.label || "#f4ead2");
    card.style.setProperty("--tilt", (((i * 37) % 7) - 3) + "deg");   // sedikit variasi kemiringan tiap buku
    card.setAttribute("role", "listitem");
    card.tabIndex = 0;
    card.setAttribute("aria-label", `${book.title} — ${book.authors}. Buka rincian.`);
    card.innerHTML = `
      <div class="b-face b-top" aria-hidden="true"></div>
      <div class="b-face b-side" aria-hidden="true"></div>
      <div class="b-face b-front">
        <span class="b-trim top"></span>
        <span class="b-title">${book.title}</span>
        <span class="b-field">${book.field}</span>
        <span class="b-trim bottom"></span>
      </div>`;
    const toggle = () => {
      if (moved) { moved = false; return; }   // ini akhir dari geseran, bukan klik untuk membuka buku
      if (openBook === card) { closePanel(); return; }
      openPanel(book, card);
    };
    card.addEventListener("click", toggle);
    card.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toggle(); }
    });
    track.appendChild(card);
  });

  /* ---- geser rak: tombol, drag, roda, dan gulir sentuhan alami ---- */
  function nudge(dir) {
    track.scrollBy({ left: dir * track.clientWidth * 0.5, behavior: "smooth" });
  }
  document.getElementById("libPrev").addEventListener("click", () => nudge(-1));
  document.getElementById("libNext").addEventListener("click", () => nudge(1));

  let dragging = false, dragStartX = 0, scrollStart = 0, moved = false, activePid = null;
  track.addEventListener("pointerdown", (ev) => {
    if (ev.pointerType === "touch") return;      // sentuhan pakai gulir bawaan
    activePid = ev.pointerId;
    dragStartX = ev.clientX;
    scrollStart = track.scrollLeft;
    moved = false;
    // "dragging" baru diaktifkan setelah gerakan nyata terdeteksi (lihat pointermove),
    // supaya klik biasa (turun-naik tanpa gerak) tidak ikut ditangkap sebagai geseran
    // — sebelumnya setPointerCapture dipanggil langsung di sini dan itu membuat event
    // "lepas klik" dialihkan ke rak, bukan ke buku, sehingga buku gagal terbuka.
  });
  track.addEventListener("pointermove", (ev) => {
    if (ev.pointerId !== activePid) return;
    const dx = ev.clientX - dragStartX;
    if (!dragging && Math.abs(dx) > 4) {
      dragging = true; moved = true;
      track.classList.add("dragging");
      try { track.setPointerCapture(ev.pointerId); } catch (e) { /* abaikan */ }
    }
    if (dragging) track.scrollLeft = scrollStart - dx;
  });
  const endDrag = (ev) => {
    if (ev && ev.pointerId !== activePid) return;
    dragging = false; activePid = null;
    track.classList.remove("dragging");
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  stage.tabIndex = -1;
  stage.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowLeft") { nudge(-1); ev.preventDefault(); }
    if (ev.key === "ArrowRight") { nudge(1); ev.preventDefault(); }
    if (ev.key === "Escape") closePanel();
  });

  // sembunyikan petunjuk begitu pengguna mulai berinteraksi
  track.addEventListener("scroll", () => hint.classList.add("dim"), { once: true, passive: true });
})();
