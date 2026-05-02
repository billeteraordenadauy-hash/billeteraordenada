async function iniciarPago() {
  const btn = document.getElementById("btn-pagar");
  btn.disabled = true;
  btn.innerText = "Cargando...";

  try {
    const response = await fetch("/crear-pago", { method: "POST" });
    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No se recibió URL");
    }
  } catch (error) {
    btn.disabled = false;
    btn.innerText = "Comprar ahora — USD 8";
    alert("Hubo un problema. Intentá de nuevo.");
  }
}

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