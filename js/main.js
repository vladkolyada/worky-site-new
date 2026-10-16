/* Worky · main.js — DARK LUXE
   [J1]–[J15] — ключові рішення. */
(() => {
  "use strict";

  const STORE_KEY = "worky-lang";
  const attrMap = { "data-i18n-alt": "alt", "data-i18n-label": "aria-label" };
  const dict = {
    uk: { "js.found": "Знайдено: {n}", "js.none": "Нічого не знайдено" },
    en: window.WORKY_EN || {}
  };
  let lang = "uk";

  /* [J1] Збір UA-рядків */
  function collectUk() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (!key) return;
      dict.uk[key] ??= el.textContent;
    });
    for (const [dataAttr, target] of Object.entries(attrMap)) {
      document.querySelectorAll(`[${dataAttr}]`).forEach(el => {
        const key = el.getAttribute(dataAttr);
        if (!key) return;
        dict.uk[key] ??= el.getAttribute(target);
      });
    }
  }

  /* [J2] Переклад */
  const t = key => dict[lang][key] ?? dict.uk[key] ?? key;

  /* [J14] Рендер статті */
  function renderPost() {
    const data = window.__currentPost;
    if (!data) return;
    const d = data[lang] || data.uk || data.en;
    if (!d) return;

    const titleEl = document.querySelector("[data-post-title]");
    const dateEl = document.querySelector("[data-post-date]");
    const bodyEl = document.querySelector("[data-post-body]");
    const authorEl = document.querySelector("[data-post-author]");
    const imgEl = document.querySelector("[data-post-image]");

    if (titleEl) titleEl.textContent = d.title || "";
    if (dateEl) dateEl.textContent = d.date || "";
    if (bodyEl) bodyEl.innerHTML = d.body || "";
    if (authorEl) authorEl.textContent = data.author || "";
    if (imgEl && data.image) imgEl.src = data.image;
    document.title = (d.title || "Worky") + " — Worky";
  }

  /* [J3] Перемикання мови */
  function setLang(next) {
    lang = dict[next] ? next : "uk";
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (key) el.textContent = t(key);
    });
    for (const [dataAttr, target] of Object.entries(attrMap)) {
      document.querySelectorAll(`[${dataAttr}]`).forEach(el => {
        const key = el.getAttribute(dataAttr);
        if (key) el.setAttribute(target, t(key));
      });
    }
    document.querySelectorAll("[data-lang]").forEach(btn => {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
    });
    try { localStorage.setItem(STORE_KEY, lang); } catch {}
    filterPosts();
    renderPost();
  }

  /* [J4] Меню */
  const menu = document.querySelector(".menu");
  if (menu) {
    menu.addEventListener("keydown", event => {
      if (event.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary").focus();
      }
    });
    menu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => { menu.open = false; });
    });
    const mq = window.matchMedia("(min-width: 48rem)");
    const syncMenu = (e) => {
      if (e.matches) menu.setAttribute("open", "");
      else menu.removeAttribute("open");
    };
    mq.addEventListener("change", syncMenu);
    syncMenu(mq);
  }

  /* [J5] Пошук */
  const search = document.querySelector("[data-search]");
  const input = search ? search.querySelector("input") : null;
  const status = search ? search.querySelector("[role='status']") : null;
  const posts = [...document.querySelectorAll("[data-post]")];
  function filterPosts() {
    if (!input) return;
    const query = input.value.trim().toLowerCase();
    let shown = 0;
    posts.forEach(post => {
      const text = [...post.querySelectorAll("h3, p")].map(el => el.textContent).join(" ").toLowerCase();
      const match = !query || text.includes(query);
      post.hidden = !match;
      if (match) shown++;
    });
    if (status) status.textContent = !query ? "" : shown ? t("js.found").replace("{n}", shown) : t("js.none");
  }
  if (search) { search.hidden = false; input.addEventListener("input", filterPosts); }

  /* [J6] Reveal */
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealRules = [
    { sel: ".cards > .reveal",    pattern: ["left", "up", "right"] },
    { sel: ".gallery > .reveal",  pattern: ["mask", "zoom", "mask"] },
    { sel: ".services > .reveal", pattern: ["left", "right"] },
    { sel: ".packs > .reveal",    pattern: ["up", "zoom", "up"] },
    { sel: ".posts > .reveal",    pattern: ["down", "left", "right"] },
    { sel: ".stat.reveal",        pattern: ["up"] },
    { sel: ".manifesto-item",     pattern: ["left"] },
    { sel: ".service-card",       pattern: ["up"] },
    { sel: ".project",            pattern: ["up"] }
  ];
  function assignReveal() {
    revealRules.forEach(rule => {
      document.querySelectorAll(rule.sel).forEach((el, i) => {
        if (!el.classList.contains("reveal")) el.classList.add("reveal");
        if (!el.dataset.reveal) el.dataset.reveal = rule.pattern[i % rule.pattern.length];
      });
    });
    document.querySelectorAll(".section > .wrap > h2, .section-head h2").forEach(el => {
      el.classList.add("reveal");
      if (!el.dataset.reveal) el.dataset.reveal = "up";
    });
  }
  function initReveal() {
    assignReveal();
    const reveals = document.querySelectorAll(".reveal");
    if (!reveals.length) return;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      reveals.forEach(el => el.classList.add("is-visible"));
      return;
    }
    const obs = new IntersectionObserver((entries, ob) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          ob.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.1 });
    reveals.forEach(el => obs.observe(el));
  }

  /* [J7] Лічильники */
  function initCounters() {
    const counters = document.querySelectorAll("[data-count]");
    if (!counters.length || prefersReduced) {
      counters.forEach(c => c.textContent = c.dataset.count);
      return;
    }
    const obs = new IntersectionObserver((entries, ob) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = +el.dataset.count;
        const dur = 1600;
        const start = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        ob.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => obs.observe(c));
  }

  /* [J8] Курсор */
  function initCursor() {
    if (window.matchMedia("(pointer: coarse)").matches || prefersReduced) return;
    const cursor = document.createElement("div");
    cursor.className = "cursor";
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    document.body.append(cursor, dot);

    let mx = -100, my = -100, cx = -100, cy = -100, dx = -100, dy = -100;
    window.addEventListener("pointermove", e => {
      mx = e.clientX; my = e.clientY;
      dx = mx; dy = my;
    }, { passive: true });

    function loop() {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();

    const hoverSelectors = "a, button, .btn, .service-card, .project, .post-row, summary, .lang button";
    document.querySelectorAll(hoverSelectors).forEach(el => {
      el.addEventListener("pointerenter", () => {
        const label = el.dataset.cursor || (el.matches(".project, .service-card") ? "View" : "");
        cursor.classList.add("is-hover");
        cursor.dataset.label = label;
      });
      el.addEventListener("pointerleave", () => {
        cursor.classList.remove("is-hover");
        cursor.dataset.label = "";
      });
    });
  }

  /* [J9] Магнітні кнопки */
  function initMagnetic() {
    if (prefersReduced) return;
    document.querySelectorAll(".btn").forEach(btn => {
      btn.addEventListener("pointermove", e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15 - 2}px)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* [J10] Паралакс hero */
  function initParallax() {
    const bg = document.querySelector(".hero-bg");
    if (!bg || prefersReduced) return;
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight) bg.style.transform = `translateY(${y * 0.35}px)`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* [J11] Плавні переходи */
  function initPageTransition() {
    if (prefersReduced) return;
    document.querySelectorAll("a[href$='.html'], a[href*='.html?']").forEach(a => {
      a.addEventListener("click", e => {
        if (a.target === "_blank" || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        document.body.style.transition = "opacity .35s ease";
        document.body.style.opacity = "0";
        setTimeout(() => { window.location.href = a.href; }, 320);
      });
    });
  }

  /* [J13] Ініціалізація статті */
  function initPost() {
    const hasPost = document.querySelector("[data-post-body]");
    if (!hasPost) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || "1";
    window.__currentPost = (window.WORKY_POSTS && window.WORKY_POSTS[id]) || null;
  }

  /* [J15] Запуск */
  collectUk();
  initPost();

  let saved = "uk";
  try { saved = localStorage.getItem(STORE_KEY) || "uk"; } catch {}
  document.querySelectorAll("[data-lang]").forEach(btn => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });
  setLang(saved);

  initReveal();
  initCounters();
  initCursor();
  initMagnetic();
  initParallax();
  initPageTransition();
})();