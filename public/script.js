// ============================================================
// BilleteraOrdenadaUY — Script principal
// Maneja: botón de pago + acordeón FAQ
// ============================================================

// --- Iniciar pago con Mercado Pago ---
async function iniciarPago() {
  const btn = document.getElementById("btn-pagar");
  const txtNormal = document.getElementById("btn-texto");
  const txtLoading = document.getElementById("btn-loading");

  // Mostrar estado de carga
  btn.disabled = true;
  txtNormal.style.display = "none";
  txtLoading.style.display = "inline";

  try {
    // Llama al servidor para crear la preferencia de pago
    const response = await fetch("/crear-pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Error del servidor");
    }

    const data = await response.json();

    if (data.url) {
      // Redirige al checkout de Mercado Pago
      window.location.href = data.url;
    } else {
      throw new Error("No se recibió URL de pago");
    }
  } catch (error) {
    console.error("Error al iniciar pago:", error);
    alert("Hubo un problema al procesar el pago. Por favor intentá de nuevo.");

    // Restaurar botón
    btn.disabled = false;
    txtNormal.style.display = "inline";
    txtLoading.style.display = "none";
  }
}

// --- Acordeón FAQ ---
function toggleFaq(boton) {
  const item = boton.parentElement;
  const respuesta = item.querySelector(".faq-respuesta");
  const estaAbierto = boton.classList.contains("abierta");

  // Cerrar todos los items abiertos
  document.querySelectorAll(".faq-pregunta.abierta").forEach((btn) => {
    btn.classList.remove("abierta");
    btn.parentElement.querySelector(".faq-respuesta").classList.remove("visible");
  });

  // Si estaba cerrado, abrirlo
  if (!estaAbierto) {
    boton.classList.add("abierta");
    respuesta.classList.add("visible");
  }
}

// --- Animación suave al hacer scroll (intersection observer) ---
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
