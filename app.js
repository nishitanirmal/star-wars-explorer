(function () {
  const D = window.SW;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
  const CH = byId(D.characters), PL = byId(D.planets), CR = byId(D.creators), MD = byId(D.media), TK = byId(D.tech);
  const cid = (id) => D.ALIAS[id] || id;
  const TYPE_LABEL = { film: "Film", series: "Series", book: "Book", comic: "Comic", game: "Game" };
  const STATUS_LABEL = { canon: "Canon", legends: "Legends", fan: "Fan-made" };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------------------- state
  const state = {
    view: "timeline",
    types: new Set(["film", "series", "book", "comic", "game"]),
    nonCanon: true,
    order: "release",
    sel: null, // { kind, id }
  };

  // ------------------------------------------------------------- derived
  function visibleMedia() {
    return D.media.filter((m) => state.types.has(m.type) && (state.nonCanon || m.status === "canon"));
  }
  function index() {
    const vm = visibleMedia();
    const charMedia = {}, planetMedia = {}, creatorMedia = {}, techMedia = {};
    for (const m of vm) {
      m.characters.forEach((c) => (charMedia[c] = charMedia[c] || []).push(m));
      m.planets.forEach((p) => (planetMedia[p] = planetMedia[p] || []).push(m));
      m.creators.forEach((c) => (creatorMedia[c] = creatorMedia[c] || []).push(m));
    }
    const vset = new Set(vm.map((m) => m.id));
    for (const t of D.tech) techMedia[t.id] = t.media.filter((id) => vset.has(id)).map((id) => MD[id]);
    return { vm, charMedia, planetMedia, creatorMedia, techMedia, vset };
  }
  let IX = index();

  const fmtYear = (y) => (y < 0 ? `${-y} BBY` : y === 0 ? "0 BBY" : `${y} ABY`);
  const fmtRange = ([a, b]) => (a === b ? fmtYear(a) : `${fmtYear(a)} to ${fmtYear(b)}`);
  const natives = (pid) => D.characters.filter((c) => c.home === pid);
  const visitedPlanets = (c) => {
    const s = new Set();
    (IX.charMedia[c.id] || []).forEach((m) => m.planets.forEach((p) => p !== c.home && s.add(p)));
    return [...s];
  };
  function coStars(c, n = 6) {
    const counts = {};
    (IX.charMedia[c.id] || []).forEach((m) => m.characters.forEach((o) => { if (o !== c.id) counts[o] = (counts[o] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n);
  }
  function collaborators(cr, n = 8) {
    const counts = {};
    (IX.creatorMedia[cr.id] || []).forEach((m) => m.creators.forEach((o) => { if (o !== cr.id) counts[o] = (counts[o] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n);
  }
  function relations(c) {
    const r = { parents: c.parents || [], siblings: c.siblings || [], spouse: c.spouse || [], children: c.children || [] };
    // reverse links
    for (const o of D.characters) {
      if ((o.children || []).includes(c.id) && !r.parents.includes(o.id)) r.parents.push(o.id);
      if ((o.parents || []).includes(c.id) && !r.children.includes(o.id)) r.children.push(o.id);
      if ((o.spouse || []).includes(c.id) && !r.spouse.includes(o.id)) r.spouse.push(o.id);
      if ((o.siblings || []).includes(c.id) && !r.siblings.includes(o.id)) r.siblings.push(o.id);
    }
    return r;
  }

  // ------------------------------------------------------------- starfield
  const stars = (function () {
    const cv = $("#stars"), ctx = cv.getContext("2d");
    let W = 0, H = 0, pts = [], speed = 0.35, target = 0.35, vx = 0.5, vy = 0.5, tvx = 0.5, tvy = 0.5;
    const N = 420;
    function resize() { W = cv.width = innerWidth * devicePixelRatio; H = cv.height = innerHeight * devicePixelRatio; }
    function reset(p) { p.x = (Math.random() - 0.5) * 2; p.y = (Math.random() - 0.5) * 2; p.z = Math.random() * 1 + 0.05; p.pz = p.z; }
    for (let i = 0; i < N; i++) { const p = {}; reset(p); pts.push(p); }
    addEventListener("resize", resize); resize();
    function frame() {
      requestAnimationFrame(frame);
      speed += (target - speed) * 0.06; target += (0.35 - target) * 0.02;
      vx += (tvx - vx) * 0.05; vy += (tvy - vy) * 0.05; tvx += (0.5 - tvx) * 0.02; tvy += (0.5 - tvy) * 0.02;
      ctx.fillStyle = speed > 2 ? "rgba(2,3,10,.35)" : "rgba(2,3,10,.6)";
      ctx.fillRect(0, 0, W, H);
      const cx = W * vx, cy = H * vy, f = Math.min(W, H) * 0.9;
      ctx.lineCap = "round";
      for (const p of pts) {
        p.pz = p.z; p.z -= 0.004 * speed;
        if (p.z <= 0.02) { reset(p); p.z = 1; p.pz = 1; }
        const sx = cx + (p.x / p.z) * f, sy = cy + (p.y / p.z) * f;
        const px = cx + (p.x / p.pz) * f, py = cy + (p.y / p.pz) * f;
        if (sx < 0 || sx > W || sy < 0 || sy > H) continue;
        const a = Math.min(1, (1 - p.z) * 1.2), w = Math.max(0.6, (1 - p.z) * 2.2) * devicePixelRatio;
        ctx.strokeStyle = speed > 1.5 ? `rgba(140,170,255,${a})` : `rgba(200,214,255,${a * 0.9})`;
        ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
      }
    }
    if (!reduced) frame(); else { ctx.fillStyle = "#02030a"; ctx.fillRect(0, 0, W, H); }
    return {
      warp(x, y, amount = 9) { target = amount; if (x != null) { tvx = x / innerWidth; tvy = y / innerHeight; } },
    };
  })();

  // ------------------------------------------------------------- panel
  const panel = $("#panel"), panelBody = $("#panelBody");
  let disposeModel = null;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (kind, id, label, extra = "") => `<button class="lk ${{ character: "chr", planet: "pl", creator: "cr", media: "md", tech: "tk" }[kind]}" data-kind="${kind}" data-id="${id}">${esc(label)}${extra ? `<small>${esc(extra)}</small>` : ""}</button>`;
  const badge = (s) => `<span class="badge ${s}">${STATUS_LABEL[s]}</span>`;
  const wiki = (slug) => `<a href="${D.W(slug)}" target="_blank" rel="noopener">Wookieepedia ↗</a>`;
  const sec = (title, n, body) => body ? `<div class="p-sec"><div class="p-h"><span>${title}</span>${n != null ? `<b>${n}</b>` : ""}</div>${body}</div>` : "";
  const mediaLinks = (list) => list.length ? `<div class="links">${list.map((m) => link("media", m.id, m.title, `${TYPE_LABEL[m.type]} · ${m.year}`)).join("")}</div>` : "";
  const charLinks = (ids) => ids.length ? `<div class="links">${ids.map((id) => CH[cid(id)] ? link("character", cid(id), CH[cid(id)].name) : "").join("")}</div>` : "";
  const planetLinks = (ids) => ids.length ? `<div class="links">${ids.map((id) => PL[id] ? link("planet", id, PL[id].name) : "").join("")}</div>` : "";

  function showPanel(html) {
    if (disposeModel) { disposeModel(); disposeModel = null; }
    panelBody.innerHTML = html;
    panel.scrollTop = 0;
    panel.classList.add("open");
    if (!reduced) { panelBody.classList.remove("decode"); panel.classList.remove("scan"); void panelBody.offsetWidth; panelBody.classList.add("decode"); panel.classList.add("scan"); }
  }
  function idlePanel() {
    const msgs = {
      timeline: "Select an entry to read its synopsis, worlds, cast and creators.",
      characters: "Select a character. Bubbles are sized by how many entries they appear in, grouped by faction.",
      planets: "Select a world. Spheres are sized by how often the world appears.",
      creators: "Select a creator to see their work and collaborators.",
      tech: "Select a weapon, gadget or ship. Drag to turn the hologram, scroll to zoom.",
    };
    showPanel(`<div class="p-kicker">Readout</div><div class="idle">${TIE_SVG}${msgs[state.view]}<br><br>Filters in the bar apply to every view. ${IX.vm.length} of ${D.media.length} entries shown.</div>`);
    panel.classList.remove("open");
  }

  function panelMedia(m) {
    showPanel(`
      <div class="p-kicker">${TYPE_LABEL[m.type]} · ${m.year}</div>
      <div class="p-title">${esc(m.title)}</div>
      <div class="p-sub">${badge(m.status)} &nbsp; ${wiki(m.wiki)}</div>
      <div class="stat"><div><div class="k">Released</div><div class="v">${m.year}</div></div><div><div class="k">Story</div><div class="v" style="font-size:14px;padding-top:6px">${fmtRange(m.story)}</div></div></div>
      <div class="p-sec"><p class="p-text">${esc(m.synopsis)}</p></div>
      ${sec("Characters", m.characters.length, charLinks(m.characters))}
      ${sec("Planets", m.planets.length, planetLinks(m.planets))}
      ${sec("Creators", m.creators.length, `<div class="links">${m.creators.map((c) => link("creator", c, CR[c].name, CR[c].role.split(",")[0])).join("")}</div>`)}
      ${sec("Tech seen here", null, techLinksFor(m))}
    `);
  }
  function techLinksFor(m) {
    const t = D.tech.filter((t) => t.media.includes(m.id));
    return t.length ? `<div class="links">${t.map((x) => link("tech", x.id, x.name)).join("")}</div>` : "";
  }
  function panelCharacter(c) {
    const ms = IX.charMedia[c.id] || [];
    const r = relations(c);
    const rel = (label, ids) => ids.length ? `<div class="kv-row"><div class="p-h" style="border:0;margin:6px 0 4px"><span>${label}</span></div>${charLinks(ids)}</div>` : "";
    const co = coStars(c);
    showPanel(`
      <div class="p-kicker">Character · ${esc(c.faction)}</div>
      <div class="p-title">${esc(c.name)}</div>
      <div class="p-sub">${wiki(c.wiki)}</div>
      <div class="stat"><div><div class="k">Appearances</div><div class="v">${ms.length}</div></div><div><div class="k">Homeworld</div><div class="v" style="font-size:13px;padding-top:6px">${c.home && PL[c.home] ? link("planet", c.home, PL[c.home].name) : "Unknown"}</div></div></div>
      ${c.antagonist && CH[cid(c.antagonist)] ? sec("Main antagonist", null, charLinks([c.antagonist])) : ""}
      <div class="p-sec"><div class="p-h"><span>Family</span><b>${r.parents.length + r.siblings.length + r.spouse.length + r.children.length}</b></div>${(r.parents.length || r.siblings.length || r.spouse.length || r.children.length) ? `${rel("Parents", r.parents)}${rel("Siblings", r.siblings)}${rel("Spouse", r.spouse)}${rel("Children", r.children)}` : `<div class="idle">No recorded family.</div>`}</div>
      ${sec("Often appears with", null, co.length ? `<div class="links">${co.map(([id, n]) => link("character", id, CH[id].name, `×${n}`)).join("")}</div>` : "")}
      ${sec("Planets travelled to", null, planetLinks(visitedPlanets(c)))}
      ${sec("Appears in", ms.length, mediaLinks(ms))}
      ${sec("Uses", null, techLinksForChar(c))}
    `);
  }
  function techLinksForChar(c) {
    const t = D.tech.filter((t) => t.users.includes(c.id));
    return t.length ? `<div class="links">${t.map((x) => link("tech", x.id, x.name)).join("")}</div>` : "";
  }
  function panelPlanet(p) {
    const ms = IX.planetMedia[p.id] || [];
    const nat = natives(p.id);
    const ev = p.events.filter((e) => IX.vset.has(e.media));
    showPanel(`
      <div class="p-kicker">Planet · ${esc(p.region)}</div>
      <div class="p-title">${esc(p.name)}</div>
      <div class="p-sub">${wiki(p.name.replace(/ /g, "_"))}</div>
      ${p.blurb ? `<p class="p-text">${esc(p.blurb)}</p>` : ""}
      <div class="stat"><div><div class="k">Appearances</div><div class="v">${ms.length}</div></div><div><div class="k">Natives</div><div class="v">${nat.length}</div></div></div>
      ${sec("Key events", ev.length, ev.map((e) => `<div class="evt">${esc(e.text)} <button data-kind="media" data-id="${e.media}">${esc(MD[e.media].title)} →</button></div>`).join(""))}
      ${sec("Native characters", nat.length, charLinks(nat.map((c) => c.id)))}
      ${sec("Media set here", ms.length, mediaLinks(ms))}
    `);
  }
  function panelCreator(c) {
    const ms = IX.creatorMedia[c.id] || [];
    const col = collaborators(c);
    const byStatus = { canon: 0, legends: 0, fan: 0 };
    ms.forEach((m) => byStatus[m.status]++);
    showPanel(`
      <div class="p-kicker">Creator</div>
      <div class="p-title">${esc(c.name)}</div>
      <div class="p-sub">${esc(c.role)} &nbsp; ${wiki(c.wiki)}</div>
      <div class="stat"><div><div class="k">Works</div><div class="v">${ms.length}</div></div><div><div class="k">Canon / Legends / Fan</div><div class="v">${byStatus.canon}<span style="color:var(--ink-dim)"> / </span>${byStatus.legends}<span style="color:var(--ink-dim)"> / </span>${byStatus.fan}</div></div></div>
      ${sec("Frequent collaborators", null, col.length ? `<div class="links">${col.map(([id, n]) => link("creator", id, CR[id].name, `×${n}`)).join("")}</div>` : "")}
      ${sec("Worked on", ms.length, ms.length ? `<div class="links">${ms.map((m) => link("media", m.id, m.title, `${TYPE_LABEL[m.type]} · ${STATUS_LABEL[m.status]}`)).join("")}</div>` : "")}
    `);
  }
  function panelTech(t) {
    const ms = IX.techMedia[t.id] || [];
    showPanel(`
      <div class="p-kicker">${esc(t.kind)}</div>
      <div class="p-title">${esc(t.name)}</div>
      <div class="p-sub">${wiki(t.wiki)}</div>
      <div class="p-switch" role="tablist"><button class="chip" data-mode="holo" aria-pressed="true">Hologram</button><button class="chip" data-mode="3d" aria-pressed="false">3D model</button><button class="chip" data-mode="real" aria-pressed="false">Still</button></div>
      <div class="p-model" id="pModel"><span class="tag">Hologram</span><span class="hint">Drag to rotate · scroll to zoom</span></div>
      <div class="p-3d" id="p3d" hidden></div><div class="p-cred" id="p3dCred" hidden></div>
      <div class="p-real" id="pReal" hidden></div>
      <p class="p-text">${esc(t.blurb)}</p>
      <p class="p-text" style="color:var(--ink-dim)">${esc(t.use)}</p>
      ${sec("Used by", t.users.length, charLinks(t.users))}
      ${sec("Appears in", ms.length, mediaLinks(ms))}
    `);
    disposeModel = SWModels.mount($("#pModel"), t.model);
    $$(".p-switch .chip").forEach((b) => b.addEventListener("click", () => {
      $$(".p-switch .chip").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const mode = b.dataset.mode;
      $("#pModel").hidden = mode !== "holo"; $("#pReal").hidden = mode !== "real";
      $("#p3d").hidden = mode !== "3d"; $("#p3dCred").hidden = mode !== "3d";
      if (mode === "real") loadReal(t);
      if (mode === "3d") load3d(t);
    }));
  }
  // Community 3D models from Sketchfab, searched live and shown in Sketchfab's own viewer.
  const sfCache = {};
  async function load3d(t, step = 0) {
    const box = $("#p3d"), cred = $("#p3dCred");
    if (!box) return;
    if (!sfCache[t.id]) {
      box.innerHTML = `<div class="msg">Searching Sketchfab for a model…</div>`; cred.innerHTML = "";
      try {
        const url = `https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(t.sfq || t.name)}&sort_by=-likeCount&count=8`;
        const j = await (await fetch(url)).json();
        sfCache[t.id] = { i: 0, list: (j.results || []).filter((r) => r.uid) };
      } catch (err) {
        box.innerHTML = `<div class="msg">Could not reach Sketchfab.<br><a href="https://sketchfab.com/search?q=${encodeURIComponent(t.sfq || t.name)}" target="_blank" rel="noopener">Search Sketchfab ↗</a></div>`;
        return;
      }
    }
    const c = sfCache[t.id];
    if (!c.list.length) { box.innerHTML = `<div class="msg">No model found.<br><a href="https://sketchfab.com/search?q=${encodeURIComponent(t.sfq || t.name)}" target="_blank" rel="noopener">Search Sketchfab ↗</a></div>`; return; }
    c.i = (c.i + step + c.list.length) % c.list.length;
    const m = c.list[c.i];
    if (!box.isConnected) return;
    box.innerHTML = `<iframe title="${esc(m.name)}" src="https://sketchfab.com/models/${m.uid}/embed?autostart=1&ui_theme=dark&ui_infos=0&ui_watermark=0&ui_hint=0&transparent=1&preload=1" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen></iframe>`;
    const lic = m.license && (m.license.label || m.license);
    cred.innerHTML = `<span><a href="${m.viewerUrl || ("https://sketchfab.com/3d-models/" + m.uid)}" target="_blank" rel="noopener">${esc(m.name)}</a> by ${esc(m.user ? m.user.displayName || m.user.username : "unknown")}${lic ? " · " + esc(lic) : ""} · ${c.i + 1}/${c.list.length}</span><button id="sfNext">Next model</button>`;
    $("#sfNext").addEventListener("click", () => load3d(t, 1));
  }
  // Lead image of the item's Wookieepedia article, fetched live from the MediaWiki API.
  const realCache = {};
  async function loadReal(t) {
    const box = $("#pReal");
    if (!box) return;
    const page = D.W(t.wiki);
    const credit = `<div class="cred">Image via <a href="${page}" target="_blank" rel="noopener">Wookieepedia</a> · © Lucasfilm, shown for reference</div>`;
    if (realCache[t.id]) { box.innerHTML = realCache[t.id] === "none" ? `<div class="msg">No image on the Wookieepedia article.<br><a href="${page}" target="_blank" rel="noopener">Open the article ↗</a></div>` : `<img src="${realCache[t.id]}" alt="${esc(t.name)}">${credit}`; return; }
    box.innerHTML = `<div class="msg">Requesting archive image…</div>`;
    try {
      const url = `https://starwars.fandom.com/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=900&titles=${encodeURIComponent(decodeURIComponent(t.wiki))}`;
      const r = await fetch(url);
      const j = await r.json();
      const pg = Object.values(j.query.pages)[0];
      const src = pg && pg.thumbnail && pg.thumbnail.source;
      realCache[t.id] = src || "none";
      if (!box.isConnected) return;
      box.innerHTML = src ? `<img src="${src}" alt="${esc(t.name)}">${credit}` : `<div class="msg">No image on the Wookieepedia article.<br><a href="${page}" target="_blank" rel="noopener">Open the article ↗</a></div>`;
    } catch (err) {
      box.innerHTML = `<div class="msg">Could not reach Wookieepedia.<br><a href="${page}" target="_blank" rel="noopener">Open the article ↗</a></div>`;
    }
  }

  panelBody.addEventListener("click", (e) => {
    const b = e.target.closest("[data-kind]");
    if (b) select(b.dataset.kind, b.dataset.id, true);
  });
  $("#pClose").addEventListener("click", () => { panel.classList.remove("open"); });

  // ------------------------------------------------------------- selection
  const KIND_VIEW = { media: "timeline", character: "characters", planet: "planets", creator: "creators", tech: "tech" };
  function select(kind, id, fromPanel = false, evt) {
    const view = KIND_VIEW[kind];
    if (view !== state.view) setView(view, false);
    state.sel = { kind, id };
    const p = evt ? [evt.clientX, evt.clientY] : null;
    stars.warp(p ? p[0] : null, p ? p[1] : null, kind === "media" ? 7 : 10);
    SWSound.warp(); setTimeout(SWSound.open, 180);
    if (kind === "media") { panelMedia(MD[id]); focusCard(id); }
    if (kind === "character") { panelCharacter(CH[id]); charts.characters.focus(id); }
    if (kind === "planet") { panelPlanet(PL[id]); charts.planets.focus(id); }
    if (kind === "creator") { panelCreator(CR[id]); charts.creators.focus(id); }
    if (kind === "tech") { panelTech(TK[id]); focusTech(id); }
  }
  function clearSel() {
    state.sel = null;
    SWSound.close();
    idlePanel();
    $("#tlList").classList.remove("focused"); $$(".card.open").forEach((c) => c.classList.remove("open"));
    Object.values(charts).forEach((c) => c.focus(null));
    $$(".tcard.sel").forEach((c) => c.classList.remove("sel")); $(".tgrid")?.classList.remove("focused");
  }

  // ------------------------------------------------------------- views
  function setView(v, push = true) {
    state.view = v;
    $$(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.view === v)));
    $$(".view").forEach((s) => s.classList.toggle("on", s.id === "v-" + v));
    if (push) { history.replaceState(null, "", "#" + v); }
    render(v);
    if (!state.sel || KIND_VIEW[state.sel.kind] !== v) { state.sel = null; idlePanel(); }
  }
  function render(v) {
    if (v === "timeline") renderTimeline();
    if (v === "characters") charts.characters.render();
    if (v === "planets") charts.planets.render();
    if (v === "creators") charts.creators.render();
    if (v === "tech") renderTech();
  }
  function renderAll() {
    IX = index();
    $("#count").textContent = `${IX.vm.length} / ${D.media.length} entries`;
    render(state.view);
    if (state.sel) select(state.sel.kind, state.sel.id, true); else idlePanel();
  }

  // ------------------------------------------------------------- timeline
  function eraOf(y) {
    if (y <= -3000) return "Old Republic";
    if (y <= -1000) return "Sith Wars";
    if (y <= -100) return "High Republic";
    if (y < -19) return "Fall of the Republic";
    if (y < 0) return "Rise of the Empire";
    if (y <= 5) return "Galactic Civil War";
    if (y <= 30) return "New Republic";
    if (y <= 40) return "Rise of the First Order";
    return "Legacy";
  }
  function renderTimeline() {
    const list = $("#tlList");
    let ms = [...IX.vm];
    if (state.order === "release") ms.sort((a, b) => a.year - b.year || a.title.localeCompare(b.title));
    else ms.sort((a, b) => a.story[0] - b.story[0] || a.story[1] - b.story[1] || a.year - b.year);
    let html = "", lastEra = null;
    for (const m of ms) {
      const era = state.order === "release" ? `${Math.floor(m.year / 10) * 10}s` : eraOf(m.story[0]);
      if (era !== lastEra) { html += `<div class="era">${era}</div>`; lastEra = era; }
      const primary = state.order === "release"
        ? `<b>${m.year}</b><span>${fmtYear(m.story[0])}</span>${m.story[0] !== m.story[1] ? `<span>to ${fmtYear(m.story[1])}</span>` : ""}`
        : `<b>${fmtYear(m.story[0])}</b>${m.story[0] !== m.story[1] ? `<span>to ${fmtYear(m.story[1])}</span>` : ""}<span class="rel">rel. ${m.year}</span>`;
      html += `<article class="card" data-id="${m.id}">
        <div class="yr">${primary}</div>
        <div class="body">
          <button class="head" data-id="${m.id}"><span class="t">${esc(m.title)}</span>${badge(m.status)}<span class="meta">${TYPE_LABEL[m.type]}</span></button>
          <div class="more">
            <p class="syn">${esc(m.synopsis)}</p>
            <div class="kv">
              <div class="k">Released</div><div>${m.year}</div>
              <div class="k">Story</div><div>${fmtRange(m.story)}</div>
              <div class="k">Creators</div><div class="links">${m.creators.map((c) => link("creator", c, CR[c].name)).join("")}</div>
              <div class="k">Planets</div><div>${planetLinks(m.planets) || "<span style='color:var(--ink-dim)'>Unspecified</span>"}</div>
              <div class="k">Characters</div><div>${charLinks(m.characters) || "<span style='color:var(--ink-dim)'>Original cast</span>"}</div>
            </div>
          </div>
        </div></article>`;
    }
    list.innerHTML = html || `<div class="idle">Nothing matches these filters.</div>`;
    list.classList.remove("focused");
    if (state.sel?.kind === "media") focusCard(state.sel.id, true);
  }
  $("#tlList").addEventListener("click", (e) => {
    const lk = e.target.closest(".lk[data-kind]");
    if (lk) return select(lk.dataset.kind, lk.dataset.id, false, e);
    const head = e.target.closest(".head");
    if (!head) return;
    const id = head.dataset.id;
    if (state.sel?.kind === "media" && state.sel.id === id) return clearSel();
    select("media", id, false, e);
  });
  function focusCard(id, instant = false) {
    const list = $("#tlList"), cards = $$(".card", list);
    const i = cards.findIndex((c) => c.dataset.id === id);
    if (i < 0) return;
    cards.forEach((c, j) => {
      c.classList.toggle("open", j === i);
      const d = Math.abs(j - i);
      c.classList.toggle("near", d > 0 && d <= 2);
      c.classList.toggle("far", d > 2);
    });
    list.classList.add("focused");
    const wrap = $("#v-timeline");
    const card = cards[i];
    const top = card.offsetTop - wrap.clientHeight * 0.28;
    wrap.scrollTo({ top, behavior: instant || reduced ? "auto" : "smooth" });
  }
  $$("[data-order]").forEach((b) => b.addEventListener("click", () => {
    state.order = b.dataset.order;
    $$("[data-order]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    stars.warp(null, null, 6);
    renderTimeline();
  }));

  // ------------------------------------------------------------- bubble charts
  function makeChart(svgSel, opts) {
    const svg = d3.select(svgSel);
    let g, nodes = [], sel = null, W = 0, H = 0;
    const zoom = d3.zoom().scaleExtent([1, 9]).clickDistance(5).on("zoom", (e) => { if (g) g.attr("transform", e.transform); });
    function size() { const r = svg.node().getBoundingClientRect(); W = r.width || 800; H = r.height || 600; svg.attr("viewBox", `0 0 ${W} ${H}`); zoom.translateExtent([[0, 0], [W, H]]).extent([[0, 0], [W, H]]); }
    const section = svg.node().closest(".view");
    section.querySelectorAll("[data-zoom]").forEach((b) => b.addEventListener("click", () => {
      const t = svg.transition().duration(reduced ? 0 : 500).ease(d3.easeCubicOut);
      if (b.dataset.zoom === "in") t.call(zoom.scaleBy, 1.6);
      else if (b.dataset.zoom === "out") t.call(zoom.scaleBy, 1 / 1.6);
      else { if (sel) clearSel(); else t.call(zoom.transform, d3.zoomIdentity); }
    }));
    function render() {
      size();
      svg.selectAll("*").remove();
      svg.classed("dim", false);
      const defs = svg.append("defs");
      const grad = defs.append("radialGradient").attr("id", "sphere").attr("cx", "35%").attr("cy", "32%").attr("r", "70%");
      grad.append("stop").attr("offset", "0%").attr("stop-color", "#8fb0ff").attr("stop-opacity", .55);
      grad.append("stop").attr("offset", "45%").attr("stop-color", "#2f57e8").attr("stop-opacity", .35);
      grad.append("stop").attr("offset", "100%").attr("stop-color", "#02030a").attr("stop-opacity", .9);
      hud(svg, W, H);
      g = svg.append("g").attr("class", "zoomable");
      svg.classed("grab", true).call(zoom).on("dblclick.zoom", null);
      svg.call(zoom.transform, d3.zoomIdentity);
      nodes = opts.layout(W, H);
      opts.draw(g, nodes, W, H);
      g.selectAll(".bubble").on("click", (e, d) => {
        e.stopPropagation();
        if (sel === d.id) return clearSel();
        select(opts.kind, d.id, false, e);
      });
      svg.on("click", (e) => { if (sel && !e.target.closest(".bubble")) clearSel(); });
      if (sel) focus(sel, true);
    }
    function focus(id, instant = false) {
      sel = id;
      const all = g ? g.selectAll(".bubble") : null;
      if (!g) return;
      if (!id) {
        all.classed("sel rel ant fam home", false);
        svg.classed("dim", false);
        g.selectAll(".clabel").classed("sel", false);
        svg.transition().duration(instant || reduced ? 0 : 900).ease(d3.easeCubicInOut).call(zoom.transform, d3.zoomIdentity);
        return;
      }
      const n = nodes.find((n) => n.id === id);
      if (!n) return;
      const relset = opts.related(id);
      all.classed("sel", (d) => d.id === id)
        .classed("rel", (d) => relset.has(d.id))
        .classed("ant", (d) => relset.get(d.id) === "ant")
        .classed("fam", (d) => relset.get(d.id) === "fam")
        .classed("home", (d) => relset.get(d.id) === "home");
      g.selectAll(".clabel").classed("sel", (d) => d && d.key === n.cluster);
      svg.classed("dim", true);
      const k = Math.min(3.2, Math.max(1.6, 120 / (n.r + 6)));
      const tx = W / 2 - n.x * k, ty = H / 2 - n.y * k;
      // d3's zoom interpolator pulls out then dives in, which reads as travel
      svg.transition().duration(instant || reduced ? 0 : 1100).ease(d3.easeCubicInOut)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
    }
    return { render, focus };
  }
  function hud(svg, W, H) {
    const h = svg.append("g");
    const m = 14;
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
      h.append("path").attr("class", "hud").attr("d", `M${x},${y + sy * 18} L${x},${y} L${x + sx * 18},${y}`);
    }
    for (let i = 0; i < 12; i++) h.append("rect").attr("class", "hud").attr("x", W - m - 2).attr("y", 60 + i * 12).attr("width", 6 - (i % 3) * 2).attr("height", 3).attr("fill", i % 4 === 0 ? "var(--red)" : "var(--line)").attr("stroke", "none").attr("opacity", .8);
    h.append("text").attr("class", "hud-text").attr("x", m + 24).attr("y", m + 6).text("Archive readout");
  }

  const charts = {};
  charts.characters = makeChart("#svgChars", {
    kind: "character",
    layout(W, H) {
      const chars = D.characters.filter((c) => (IX.charMedia[c.id] || []).length);
      const factions = [...new Set(chars.map((c) => c.faction))];
      // nested packing: faction circles packed into the stage, characters packed inside each
      const root = d3.hierarchy({ children: factions.map((f) => ({ key: f, children: chars.filter((c) => c.faction === f).map((c) => ({ id: c.id, name: c.name, v: IX.charMedia[c.id].length })) })) })
        .sum((d) => d.v || 0);
      const top = 40, bottom = 36, side = 16;
      d3.pack().size([W - side * 2, H - top - bottom]).padding((d) => (d.depth === 0 ? 34 : 3))(root);
      const nodes = root.leaves().map((l) => ({ id: l.data.id, name: l.data.name, cluster: l.parent.data.key, x: l.x + side, y: l.y + top, r: l.r }));
      nodes.clusters = root.children.map((c) => ({ key: c.data.key, x: c.x + side, y: c.y + top, r: c.r + 4 }));
      return nodes;
    },
    draw(g, nodes) {
      const cl = g.selectAll(".cluster").data(nodes.clusters).join("g");
      cl.append("circle").attr("class", "cring").attr("cx", (d) => d.x).attr("cy", (d) => d.y).attr("r", (d) => d.r);
      cl.append("text").attr("class", "clabel").attr("x", (d) => d.x).attr("y", (d) => d.y - d.r - 6).text((d) => d.key);
      const b = g.selectAll(".bubble").data(nodes).join("g").attr("class", "bubble").attr("transform", (d) => `translate(${d.x},${d.y})`);
      b.append("circle").attr("class", "ring").attr("r", (d) => d.r + 3);
      b.append("circle").attr("class", "core").attr("r", 0).transition().duration(reduced ? 0 : 700).delay((d, i) => i * 4).ease(d3.easeBackOut).attr("r", (d) => d.r);
      b.append("text").attr("dy", "0.35em").text((d) => d.r > 16 ? shortName(d.name) : "").style("font-size", (d) => Math.min(11, d.r / 2.6) + "px");
      b.append("title").text((d) => `${d.name} · ${IX.charMedia[d.id].length} appearances`);
    },
    related(id) {
      const c = CH[id], m = new Map();
      const r = relations(c);
      [...r.parents, ...r.siblings, ...r.spouse, ...r.children].forEach((x) => m.set(cid(x), "fam"));
      coStars(c, 5).forEach(([x]) => m.set(x, "co"));
      if (c.antagonist) m.set(cid(c.antagonist), "ant");
      m.delete(id);
      return m;
    },
  });
  function shortName(n) { return n.split(" / ")[0].split(" (")[0]; }

  charts.planets = makeChart("#svgPlanets", {
    kind: "planet",
    layout(W, H) {
      const ps = D.planets.filter((p) => (IX.planetMedia[p.id] || []).length);
      const root = d3.hierarchy({ children: ps.map((p) => ({ id: p.id, name: p.name, v: IX.planetMedia[p.id].length })) }).sum((d) => d.v);
      d3.pack().size([W - 40, H - 40]).padding(6)(root);
      return root.leaves().map((l) => ({ id: l.data.id, name: l.data.name, x: l.x + 20, y: l.y + 20, r: l.r, cluster: null }));
    },
    draw(g, nodes) {
      const b = g.selectAll(".bubble").data(nodes).join("g").attr("class", "bubble planet").attr("transform", (d) => `translate(${d.x},${d.y})`);
      b.append("circle").attr("class", "ring-orbit").attr("r", (d) => d.r + 4).attr("transform", (d) => `rotate(${(d.x * 7) % 60 - 30}) scale(1,.35)`);
      b.append("circle").attr("class", "sphere").attr("r", 0).transition().duration(reduced ? 0 : 800).delay((d, i) => i * 6).ease(d3.easeBackOut).attr("r", (d) => d.r);
      for (const k of [0.33, 0.66]) b.append("ellipse").attr("class", "lat").attr("rx", (d) => d.r * Math.sqrt(1 - k * k)).attr("ry", (d) => d.r * Math.sqrt(1 - k * k) * 0.28).attr("cy", (d) => -d.r * k);
      for (const k of [-0.33, -0.66]) b.append("ellipse").attr("class", "lat").attr("rx", (d) => d.r * Math.sqrt(1 - k * k)).attr("ry", (d) => d.r * Math.sqrt(1 - k * k) * 0.28).attr("cy", (d) => -d.r * k);
      b.append("ellipse").attr("class", "lat").attr("rx", (d) => d.r * 0.35).attr("ry", (d) => d.r);
      b.append("text").attr("dy", (d) => d.r + 11).text((d) => d.r > 20 ? d.name : "").style("font-size", (d) => Math.min(11, 6 + d.r / 6) + "px");
      b.append("title").text((d) => `${d.name} · ${IX.planetMedia[d.id].length} appearances`);
    },
    related(id) {
      const m = new Map();
      // worlds that share media with this one
      (IX.planetMedia[id] || []).forEach((md) => md.planets.forEach((p) => p !== id && m.set(p, "co")));
      return m;
    },
  });

  charts.creators = makeChart("#svgCreators", {
    kind: "creator",
    layout(W, H) {
      const cs = D.creators.filter((c) => (IX.creatorMedia[c.id] || []).length);
      const root = d3.hierarchy({ children: cs.map((c) => ({ id: c.id, name: c.name, v: IX.creatorMedia[c.id].length })) }).sum((d) => Math.sqrt(d.v) * 2 + d.v);
      d3.pack().size([W - 40, H - 40]).padding(5)(root);
      return root.leaves().map((l) => ({ id: l.data.id, name: l.data.name, x: l.x + 20, y: l.y + 20, r: l.r, cluster: null }));
    },
    draw(g, nodes) {
      const b = g.selectAll(".bubble").data(nodes).join("g").attr("class", "bubble").attr("transform", (d) => `translate(${d.x},${d.y})`);
      b.append("circle").attr("class", "ring").attr("r", (d) => d.r + 3);
      b.append("circle").attr("class", "core").attr("r", 0).transition().duration(reduced ? 0 : 700).delay((d, i) => i * 5).ease(d3.easeBackOut).attr("r", (d) => d.r);
      b.append("text").attr("dy", "0.35em").text((d) => d.r > 18 ? d.name.split(" ").slice(-1)[0] : "").style("font-size", (d) => Math.min(11, d.r / 3) + "px");
      b.append("title").text((d) => `${d.name} · ${IX.creatorMedia[d.id].length} works`);
    },
    related(id) {
      const m = new Map();
      collaborators(CR[id], 12).forEach(([x]) => m.set(x, "co"));
      return m;
    },
  });

  // ------------------------------------------------------------- tech
  function renderTech() {
    const el = $("#techGrid");
    SWModels.clearThumbs();
    const kinds = [["weapon", "Weapons"], ["gadget", "Gadgets and equipment"], ["vehicle", "Ships and transport"]];
    el.innerHTML = kinds.map(([k, label]) => {
      const items = D.tech.filter((t) => t.kind === k);
      return `<div class="tsec">${label}</div><div class="tgrid">${items.map((t) => `<button class="tcard" data-id="${t.id}"><span class="n">${(IX.techMedia[t.id] || []).length}</span><canvas data-model="${t.model}" aria-hidden="true"></canvas><div class="tn">${esc(t.name)}</div><div class="tk">${esc(t.kind)}</div></button>`).join("")}</div>`;
    }).join("");
    $$("canvas[data-model]", el).forEach((c) => SWModels.thumb(c, c.dataset.model));
    if (state.sel?.kind === "tech") focusTech(state.sel.id);
  }
  $("#techGrid").addEventListener("click", (e) => {
    const c = e.target.closest(".tcard");
    if (!c) return;
    if (state.sel?.kind === "tech" && state.sel.id === c.dataset.id) return clearSel();
    select("tech", c.dataset.id, false, e);
  });
  function focusTech(id) {
    $$(".tcard").forEach((c) => c.classList.toggle("sel", c.dataset.id === id));
    $$(".tgrid").forEach((g) => g.classList.add("focused"));
    const c = $(`.tcard[data-id="${id}"]`);
    if (c) c.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }

  // ------------------------------------------------------------- controls
  $$(".tab").forEach((t) => t.addEventListener("click", () => { stars.warp(null, null, 5); SWSound.tab(); setView(t.dataset.view); }));
  document.addEventListener("click", (e) => { if (e.target.closest(".chip, .lk, .zoomctl button, .p-close, .evt button, #sfNext")) SWSound.click(); }, true);
  document.addEventListener("pointerover", (e) => { if (e.target.closest(".bubble, .card .head, .tcard, .tab, .chip, .lk")) SWSound.tick(); }, true);
  document.addEventListener("pointerdown", () => SWSound.unlock(), { once: true, capture: true });
  const muteBtn = $("#mute");
  const paintMute = () => { muteBtn.setAttribute("aria-pressed", String(SWSound.muted)); muteBtn.textContent = SWSound.muted ? "Audio off" : "Audio on"; };
  paintMute();
  muteBtn.addEventListener("click", () => { SWSound.toggleMute(); paintMute(); });
  // HUD readouts: clock and cursor position
  const roClock = $("#roClock"), roPos = $("#roPos");
  setInterval(() => { const d = new Date(); roClock.textContent = `GST ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`; }, 1000);
  addEventListener("pointermove", (e) => { roPos.textContent = `Cursor ${String(e.clientX).padStart(4, "0")} · ${String(e.clientY).padStart(4, "0")}`; }, { passive: true });
  $$("#typeFilters .chip").forEach((b) => b.addEventListener("click", () => {
    const on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(on));
    on ? state.types.add(b.dataset.type) : state.types.delete(b.dataset.type);
    renderAll();
  }));
  $("#nonCanon").addEventListener("click", (e) => {
    state.nonCanon = !state.nonCanon;
    e.currentTarget.setAttribute("aria-pressed", String(state.nonCanon));
    renderAll();
  });
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => render(state.view), 200); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.sel) clearSel(); });

  // TIE fighter wireframe for the idle panel, after the hologram in the brief.
  const TIE_SVG = `<svg viewBox="0 0 300 200" aria-hidden="true"><g fill="none" stroke="#3f6aff" stroke-width="1">
    <path d="M40 20 L20 60 L20 140 L40 180 L60 140 L60 60 Z" opacity=".9"/><path d="M40 20 V180 M20 100 H60" opacity=".5"/>
    <path d="M260 20 L240 60 L240 140 L260 180 L280 140 L280 60 Z" opacity=".9"/><path d="M260 20 V180 M240 100 H280" opacity=".5"/>
    <circle cx="150" cy="100" r="34"/><circle cx="150" cy="100" r="18" stroke-opacity=".7"/><circle cx="150" cy="100" r="8" fill="#3f6aff" fill-opacity=".3"/>
    <path d="M60 100 H116 M184 100 H240" stroke-width="3" opacity=".8"/><path d="M116 92 V108 M184 92 V108"/>
    <path d="M150 66 L138 82 M150 66 L162 82 M150 134 L138 118 M150 134 L162 118" opacity=".6"/>
    <g opacity=".35" stroke-dasharray="2 4"><circle cx="150" cy="100" r="60"/><circle cx="150" cy="100" r="80"/></g>
    <path d="M10 10 H30 M10 10 V30 M290 190 H270 M290 190 V170" stroke-width="1.2"/>
    </g><rect x="146" y="8" width="4" height="4" fill="#ff3b3b"/><rect x="150" y="188" width="4" height="4" fill="#ff3b3b"/>
    <text x="70" y="26" fill="#8a9ccc" font-family="IBM Plex Mono, monospace" font-size="8" letter-spacing="2">TIE/LN · SIENAR FLEET SYSTEMS</text></svg>`;

  // ------------------------------------------------------------- boot
  const hash = location.hash.replace("#", "");
  const startView = ["timeline", "characters", "planets", "creators", "tech"].includes(hash) ? hash : "timeline";
  $("#count").textContent = `${IX.vm.length} / ${D.media.length} entries`;
  setView(startView, false);
  (function boot() {
    const el = $("#boot"), lines = $$(".l", el), bar = $(".bar i", el);
    let seen = false; try { seen = sessionStorage.getItem("sw-booted") === "1"; } catch (e) {}
    const finish = () => { el.classList.add("off"); try { sessionStorage.setItem("sw-booted", "1"); } catch (e) {} setTimeout(() => el.remove(), 600); };
    if (seen || reduced) { finish(); return; }
    el.addEventListener("click", () => { SWSound.unlock(); SWSound.boot(); finish(); }, { once: true });
    requestAnimationFrame(() => (bar.style.width = "100%"));
    lines.forEach((l, i) => setTimeout(() => { l.classList.add("on"); if (i === 2) $("#bootN").textContent = `${D.media.length} OK`; }, 120 + i * 220));
    setTimeout(finish, 1500);
  })();
  // pre-render the other charts lazily on first visit; timeline is ready now.
})();
