(function () {
  const A = window.ARTIST, AW = window.AWARDS, RANK = window.AWARD_RANK;
  const PF = window.PERFORMANCES, CAREER = window.CAREER, VIDEOS = window.VIDEOS;
  const PHOTOS = window.PHOTOS, REVIEW = window.REVIEW;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const tierOf = (r) => (["대상", "최우수상", "금상"].includes(r) ? "top" : ["은상", "동상", "우수상"].includes(r) ? "mid" : "low");
  const years = Object.keys(PF).map(Number).sort((a, b) => a - b);
  const allShows = years.flatMap((y) => PF[y]);

  /* 이미지 슬롯: 원본을 불러오지 못하면 플레이스홀더 유지 */
  function photoSlot(el, src, alt) {
    if (!src) return;
    const img = new Image();
    img.alt = alt || "";
    img.loading = "lazy";
    img.onerror = () => img.remove();
    img.src = src;
    el.insertBefore(img, el.firstChild);
  }
  const phIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="12" cy="12" r="3.5"/></svg>';

  /* HERO */
  photoSlot($("heroPhoto"), A.profilePhoto.src, "김동흔 프로필 사진");
  $("heroCaption").textContent = A.profilePhoto.caption;
  const grand = AW.filter((a) => a.result === "대상").length;
  $("heroStats").innerHTML = [
    [`${AW.length}`, "가요제 수상"],
    [`<em>${grand}</em>`, "대상 수상"],
    [`${allShows.length}+`, "공연 기록"]
  ].map(([n, l]) => `<div class="stat"><span class="stat-num">${n}</span><span class="stat-label">${l}</span></div>`).join("");

  /* FACTS */
  $("facts").innerHTML = [
    ["Name", `${A.nameKo} · ${A.nameEn}`],
    ["Field", A.role],
    ["Genre", A.genre],
    ["Based in", A.region],
    ["Active", `${years[0]} — ${years[years.length - 1]}`],
    ["Instagram", `<a href="${A.instagram}" target="_blank" rel="noopener">${A.instagramHandle}</a>`]
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

  /* AWARDS — 등급별 막대 */
  const counts = RANK.map((r) => [r, AW.filter((a) => a.result === r).length]).filter(([, c]) => c);
  const max = Math.max(...counts.map(([, c]) => c));
  $("awardChart").innerHTML = counts.map(([r, c], i) =>
    `<div class="award-row" data-tier="${tierOf(r)}"><span class="award-row-label">${r}</span>` +
    `<span class="award-row-bar"><span class="award-row-fill" style="width:${(c / max) * 100}%;animation-delay:${i * 60}ms"></span></span>` +
    `<span class="award-row-count">${c}</span></div>`).join("") +
    `<p class="award-chart-note">총 ${AW.length}회 수상 · ${AW[0].date.slice(0, 4)}–${AW[AW.length - 1].date.slice(0, 4)}</p>`;
  $("awardsMeta").textContent = `${AW.length} AWARDS`;

  let lastY = "";
  $("awardList").innerHTML = AW.slice().reverse().map((a) => {
    const y = a.date.slice(0, 4);
    const sep = y !== lastY ? `<li class="award-year-sep">${y}</li>` : "";
    lastY = y;
    return sep + `<li class="award-item"><span class="award-item-date">${esc(a.date)}</span>` +
      `<span class="award-item-event">${esc(a.event)}</span>` +
      `<span class="medal" data-tier="${tierOf(a.result)}">${esc(a.result)}</span></li>`;
  }).join("");

  /* PERFORMANCES — 셋리스트 타임라인 */
  $("stageMeta").textContent = `${years[0]} — ${years[years.length - 1]} · ${allShows.length} SHOWS`;
  const tabs = $("yearTabs"), tl = $("timeline");
  let current = "all";

  function yearBlock(y) {
    const items = PF[y].map((p) => {
      const chips = [
        p.team ? `<span class="chip chip-team">${esc(p.team)}</span>` : "",
        p.note ? `<span class="chip chip-note">${esc(p.note)}</span>` : "",
        p.review ? `<span class="chip chip-review" title="원본 기록 확인 필요">검토</span>` : ""
      ].join("");
      return `<li class="set-item"><span class="set-date">${esc(p.date)}</span>` +
        `<span class="set-body"><span class="set-title">${esc(p.title)}</span>${chips}</span></li>`;
    }).join("");
    return `<div class="tl-year"><div class="tl-year-head"><div class="tl-year-num">${y}</div>` +
      `<div class="tl-year-count">${PF[y].length} shows</div></div><ol class="setlist">${items}</ol></div>`;
  }
  function renderTimeline() {
    const list = current === "all" ? years.slice().reverse() : [Number(current)];
    tl.innerHTML = list.map(yearBlock).join("");
    tabs.querySelectorAll(".year-tab").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.year === current)));
  }
  tabs.innerHTML = `<button class="year-tab" id="tab-all" data-year="all" type="button">전체<small>${allShows.length}</small></button>` +
    years.slice().reverse().map((y) => `<button class="year-tab" id="tab-${y}" data-year="${y}" type="button">${y}<small>${PF[y].length}</small></button>`).join("");
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest(".year-tab");
    if (!b) return;
    current = b.dataset.year;
    renderTimeline();
  });
  renderTimeline();

  /* VIDEOS */
  $("igLink").href = A.instagram;
  $("videoGrid").innerHTML = VIDEOS.map((v, i) =>
    `<a class="video-card${v.featured ? " is-featured" : ""}" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">` +
    `<figure class="photo video-thumb" data-thumb="https://img.youtube.com/vi/${v.id}/hqdefault.jpg">` +
    `<div class="photo-ph">${phIcon}<span>YouTube</span></div>` +
    `<div class="video-play"><span><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span></div></figure>` +
    `<div class="video-meta"><span>${esc(v.title)}</span><span class="mono">${String(i + 1).padStart(2, "0")}</span></div></a>`
  ).join("");
  document.querySelectorAll(".video-thumb").forEach((f) => photoSlot(f, f.dataset.thumb, ""));

  /* CAREER */
  const kindLabel = { teach: "Vocal Coach", wedding: "Wedding Singer", musical: "Musical", media: "Radio Guest" };
  $("careerGrid").innerHTML = CAREER.slice().reverse().map((c) =>
    `<div class="career-card" data-kind="${c.kind}"><span class="career-kind">${kindLabel[c.kind]}</span>` +
    `<span class="career-org">${esc(c.org)}</span><span class="career-role">${esc(c.role)}</span>` +
    `<span class="career-period" data-current="${/~\s*$/.test(c.period)}">${esc(c.period)}</span></div>`
  ).join("");

  /* PROJECTS — 공연 기록의 팀명 집계 (띄어쓰기 차이는 같은 팀으로 묶음) */
  const teams = new Map();
  years.forEach((y) => PF[y].forEach((p) => {
    if (!p.team) return;
    const key = p.team.replace(/\s+/g, "");
    const t = teams.get(key) || { name: p.team, count: 0, first: y, last: y };
    t.count++; t.first = Math.min(t.first, y); t.last = Math.max(t.last, y);
    teams.set(key, t);
  }));
  const typeOf = (n) => (/듀오/.test(n) ? "듀오" : /콰르텟/.test(n) ? "콰르텟" : /밴드/.test(n) ? "밴드" : "팀");
  $("projectGrid").innerHTML = [...teams.values()].sort((a, b) => b.count - a.count).map((t) =>
    `<div class="project"><span class="project-name">${esc(t.name)}</span>` +
    `<span class="project-type">${typeOf(t.name)} · ${t.first === t.last ? t.first : `${t.first}–${t.last}`}</span>` +
    `<span class="project-stat"><span>공연 기록</span><b>${t.count}</b></span></div>`
  ).join("");

  /* GALLERY */
  const g = $("galleryGrid");
  g.innerHTML = PHOTOS.map((_, i) =>
    `<figure class="photo"><div class="photo-ph">${phIcon}<span>Photo ${String(i + 1).padStart(2, "0")}</span></div></figure>`).join("");
  g.querySelectorAll(".photo").forEach((f, i) => photoSlot(f, PHOTOS[i], `김동흔 공연 사진 ${i + 1}`));

  /* CONTACT */
  $("contactList").innerHTML = [
    ["Email", A.email],
    ["Phone", A.phone],
    ["Instagram", A.instagramHandle]
  ].map(([k, v]) => `<div class="contact-line"><dt>${k}</dt><dd>${esc(v)}</dd>` +
    `<button class="copy-btn" type="button" data-copy="${esc(v)}">복사</button></div>`).join("") +
    `<a class="btn btn-primary contact-cta" href="${A.instagram}" target="_blank" rel="noopener">Instagram DM 보내기 ↗</a>`;
  $("contactList").addEventListener("click", (e) => {
    const b = e.target.closest(".copy-btn");
    if (!b) return;
    const done = () => { b.textContent = "복사됨"; setTimeout(() => (b.textContent = "복사"), 1600); };
    const fallback = () => {
      const dd = b.previousElementSibling, r = document.createRange();
      r.selectNodeContents(dd); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      b.textContent = "선택됨"; setTimeout(() => (b.textContent = "복사"), 1600);
    };
    try { navigator.clipboard.writeText(b.dataset.copy).then(done, fallback); } catch (_) { fallback(); }
  });

  /* REVIEW */
  $("reviewCount").textContent = `${REVIEW.length}건`;
  $("reviewList").innerHTML = REVIEW.map((r) => `<li><b>${esc(r.where)}</b>${esc(r.text)}</li>`).join("");
  $("srcLink").href = A.source;

  /* NAV active state */
  const links = [...document.querySelectorAll(".nav a")];
  const map = new Map(links.map((l) => [l.getAttribute("href").slice(1), l]));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.classList.remove("is-active"));
        const l = map.get(en.target.id);
        if (l) l.classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    map.forEach((_, id) => { const s = $(id); if (s) io.observe(s); });
  }
})();
