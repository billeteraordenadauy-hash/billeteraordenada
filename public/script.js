// ============================================================
// BilleteraOrdenadaUY — Script principal
// Usa Wallet Brick de Mercado Pago
// ============================================================

// Tu Public Key de producción de Mercado Pago
const publicKey = "APP_USR-42298f67-d9ed-4e82-a0fd-77df8349a9f6";

// Inicializa el SDK de MP
const mp = new MercadoPago(publicKey);

// Función que llama al servidor, obtiene el preference_id
// y renderiza el botón de MP
async function iniciarPago() {
  const btn = document.getElementById("btn-pagar");
  btn.disabled = true;
  btn.innerText = "Cargando...";

  try {
    const response = await fetch("/crear-pago", { method: "POST" });
    const data = await response.json();

    if (data.preferenceId) {
      const bricksBuilder = mp.bricks();
      await bricksBuilder.create("wallet", "walletBrick_container", {
        initialization: {
          preferenceId: data.preferenceId,
        },
      });
      btn.style.display = "none";
    } else {
      throw new Error("No se recibió preferenceId");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Hubo un problema. Intentá de nuevo.");
    btn.disabled = false;
    btn.innerText = "Comprar ahora — USD 8";
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