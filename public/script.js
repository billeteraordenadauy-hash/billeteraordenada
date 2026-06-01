// Abre el modal
function abrirModal() {
  const overlay = document.getElementById("modal-overlay");
  overlay.style.display = "flex";
}

// Cierra el modal
function cerrarModal() {
  const overlay = document.getElementById("modal-overlay");
  overlay.style.display = "none";
}

// Confirma datos y va al pago
async function confirmarYPagar() {
  const nombre = document.getElementById("modal-nombre").value.trim();
  const email = document.getElementById("modal-email").value.trim();
  const btn = document.getElementById("btn-confirmar");

  if (!nombre || !email) {
    alert("Por favor completá tu nombre y email.");
    return;
  }

  btn.disabled = true;
  btn.innerText = "Cargando...";

  try {
    const response = await fetch("/crear-pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email }),
    });

    const data = await response.json();

  if (data.url) {
      window.location.href = data.url;
    }
else {
      throw new Error("No se recibió URL de pago");
    }
  } catch (error) {
    alert("Hubo un problema. Intentá de nuevo.");
    btn.disabled = false;
    btn.innerText = "Continuar al pago →";
  }
}

// --- Acordeón FAQ ---
function toggleFaq(boton) {
  const item = boton.parentElement;
  const respuesta = item.querySelector(".faq-respuesta");
  const estaAbierto = boton.classList.contains("abierta");
  document.querySelectorAll(".faq-pregunta.abierta").forEach((btn) => {
    btn.classList.remove("abierta");
    btn.parentElement.querySelector(".faq-respuesta").classList.remove("visible");
  });
  if (!estaAbierto) {
    boton.classList.add("abierta");
    respuesta.classList.add("visible");
  }
}

// Animación al hacer scroll
document.addEventListener("DOMContentLoaded", () => {
  const elementos = document.querySelectorAll(
    ".incluye-card, .perfil-card, .resena-card, .problema-item"
  );
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  elementos.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(16px)";
    el.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    observer.observe(el);
  });
});