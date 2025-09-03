// ✅ URL correcta
const SUPABASE_URL = "https://uqgioswtmkjdjuadoncn.supabase.co";

// ✅ Solo los campos que existen (o crea las columnas si quieres conservar user_agent/page_url)
function initContactForm() {
  const form = $("#contacto-form");
  if (!form) return;
  const status = $(".form-status", form);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Enviando…";

    const fd = new FormData(form);
    const payload = {
      nombre:   (fd.get("nombre")   || "").toString().trim(),
      apellidos:(fd.get("apellidos")|| "").toString().trim() || null,
      telefono: (fd.get("telefono") || "").toString().trim() || null,
      email:    (fd.get("email")    || "").toString().trim(),
      mensaje:  (fd.get("mensaje")  || "").toString().trim(),
      // user_agent: navigator.userAgent,   // ❌ comenta o crea la columna
      // page_url:   location.href          // ❌ comenta o crea la columna
    };

    const hp = form.querySelector('input[name="website"]');
    if (hp && hp.value) { status.textContent = "Gracias."; form.reset(); return; }

    if (!payload.nombre || !payload.email || !payload.mensaje) {
      status.textContent = "Por favor completa los campos requeridos."; return;
    }

    const last = Number(localStorage.getItem("contact_last_ts") || 0);
    if (Date.now() - last < 30_000) { status.textContent = "Espera unos segundos antes de enviar de nuevo."; return; }

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
