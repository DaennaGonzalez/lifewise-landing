/* =========================================================
   Lifewise Capital — script.js
   - Menú móvil + scroll suave
   - Carruseles (Hero y Nosotros)
   - Tabs de Productos
   - Footer: año actual
   - Formulario → SUPABASE (activo)
   ========================================================= */

/* ------------------ Utilidades ------------------ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* Suavizar scroll para anchors internos */
function enableSmoothAnchors() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    // ignora externos (target _blank o URL absoluta)
    if (a.target === "_blank" || /^https?:\/\//i.test(href)) return;

    const target = document.getElementById(href.slice(1));
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    document.body.classList.remove("nav-open");
  });
}

/* ------------------ Menú móvil ------------------ */
function setupMobileNav() {
  const toggle = $(".nav-toggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });

  // Cerrar al elegir un enlace o al presionar ESC
  $$(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => document.body.classList.remove("nav-open"))
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.body.classList.remove("nav-open");
  });
}

/* ------------------ Slider genérico ------------------ */
function initSlider(root, { autoplay = true, interval = 6000 } = {}) {
  if (!root) return;
  const slidesWrap = $(".slides", root);
  const slides = $$(".slide", slidesWrap);
  const btnPrev = $("[data-prev]", root);
  const btnNext = $("[data-next]", root);
  const dotsWrap = $("[data-dots]", root);

  if (!slides.length) return;

  let index = Math.max(0, slides.findIndex((s) => s.classList.contains("is-active")));
  if (index === -1) index = 0;

  // Crear dots
  if (dotsWrap && slides.length > 1) {
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Ir al slide ${i + 1}`);
      b.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(b);
    });
  }

  function update() {
    slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
    if (dotsWrap) {
      $$(".dots button", root).forEach((d, i) => {
        if (i === index) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
    }
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    update();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  btnNext && btnNext.addEventListener("click", next);
  btnPrev && btnPrev.addEventListener("click", prev);

  update();

  // Autoplay
  let timer = null;
  function start() {
    if (!autoplay || slides.length < 2) return;
    stop();
    timer = setInterval(next, interval);
  }
  function stop() { if (timer) clearInterval(timer); timer = null; }

  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  start();
  return { next, prev, goTo, stop, start };
}

/* ------------------ Tabs de productos ------------------ */
function initProductTabs() {
  const tabs = $$(".product-tab");
  const panels = $$(".product-panel");
  if (!tabs.length || !panels.length) return;

  function activate(id) {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.target === id));
    panels.forEach((p) => {
      const active = p.id === id;
      p.toggleAttribute("hidden", !active);
      p.classList.toggle("is-active", active);
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activate(tab.dataset.target));
    tab.addEventListener("keydown", (e) => {
      const current = tabs.indexOf(tab);
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const nxt = tabs[(current + 1) % tabs.length];
        nxt.focus();
        activate(nxt.dataset.target);
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prv = tabs[(current - 1 + tabs.length) % tabs.length];
        prv.focus();
        activate(prv.dataset.target);
      }
    });
  });

  const firstActive = tabs.find((t) => t.classList.contains("is-active")) || tabs[0];
  activate(firstActive.dataset.target);
}

/* ------------------ Footer año ------------------ */
function setYear() {
  const span = $("#year");
  if (span) span.textContent = new Date().getFullYear();
}

/* ------------------ Formulario → SUPABASE ------------------ */
/*
  Requisitos en Supabase:
  - Tabla: public.tabla_lifewise_contactos
    columnas: id (identity), created_at default now(), nombre text not null,
              apellidos text, telefono text, email text not null,
              mensaje text not null, user_agent text, page_url text
  - RLS habilitado + policy:
      INSERT → rol anon → WITH CHECK: true
*/

const SUPABASE_URL = "https://uqgioswtmkjdjuadoncn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZ2lvc3d0bWtqZGp1YWRvbmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTYzMTcsImV4cCI6MjA2NTY3MjMxN30.vCLNRGVseLkR1RclsFanDUWYJXkib_X9Xx4kMNSBudM";
const SUPABASE_TABLE = "tabla_lifewise_contactos";

/** Inserta vía REST (sin SDK). Usa return=minimal para no requerir SELECT. */
async function submitToSupabase(payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(err || `HTTP ${res.status}`);
  }
  return { ok: true };
}

function initContactForm() {
  const form = $("#contacto-form");
  if (!form) return;
  const status = $(".form-status", form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Enviando…";

    const fd = new FormData(form);
    const payload = {
      nombre: (fd.get("nombre") || "").toString().trim(),
      apellidos: (fd.get("apellidos") || "").toString().trim() || null,
      telefono: (fd.get("telefono") || "").toString().trim() || null,
      email: (fd.get("email") || "").toString().trim(),
      mensaje: (fd.get("mensaje") || "").toString().trim(),
    };

    // Honeypot opcional (si exists <input name="website"> oculto)
    const hp = form.querySelector('input[name="website"]');
    if (hp && hp.value) {
      status.textContent = "Gracias.";
      form.reset();
      return;
    }

    // Validaciones mínimas
    if (!payload.nombre || !payload.email || !payload.mensaje) {
      status.textContent = "Por favor completa los campos requeridos.";
      return;
    }

    // Anti-spam simple: 1 envío cada 30s
    const last = Number(localStorage.getItem("contact_last_ts") || 0);
    if (Date.now() - last < 30_000) {
      status.textContent = "Espera unos segundos antes de enviar de nuevo.";
      return;
    }

    // Lock UI
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.style.opacity = .7;

    try {
      await submitToSupabase(payload);
      status.textContent = "¡Gracias! Hemos recibido tu información.";
      form.reset();
      localStorage.setItem("contact_last_ts", String(Date.now()));
    } catch (err) {
      console.error(err);
      status.textContent = "Ocurrió un error al enviar. Intenta de nuevo.";
    } finally {
      btn.disabled = false; btn.style.opacity = 1;
    }
  });
}

/* ------------------ Inicialización ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  setupMobileNav();
  enableSmoothAnchors();

  // Sliders
  initSlider($('[data-slider="hero"]'), { autoplay: true, interval: 6000 });
  initSlider($('[data-slider="about"]'), { autoplay: true, interval: 5000 });

  // Productos
  initProductTabs();

  // Año footer
  setYear();

  // Formulario
  initContactForm();
});

