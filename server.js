// ============================================================
// BilleteraOrdenadaUY — Servidor principal
// Maneja la creación de pagos con Mercado Pago
// ============================================================

require("dotenv").config();
const express = require("express");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Configuración de Mercado Pago ---
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-4649243425530749-050119-b560a6d6acde9ae37734b8265669fd2d-776011483",
});

// --- Middlewares ---
app.use(express.json());
app.use(express.static("public")); // Sirve los archivos de la carpeta public/

// ============================================================
// RUTA: Crear preferencia de pago
// El frontend llama a este endpoint cuando el usuario
// hace clic en "Comprar ahora"
// ============================================================
app.post("/crear-pago", async (req, res) => {
  try {
    const preference = new Preference(client);

    const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

    const result = await preference.create({
      body: {
        items: [
          {
            id: "kit-finanzas-2026",
            title: "Kit de Finanzas Personales 2026 — BilleteraOrdenadaUY",
            description:
              "Planillas para organizar tus finanzas personales en Uruguay. Incluye control de gastos, ahorro, objetivos y más.",
            quantity: 1,
            unit_price: 8, // USD
            currency_id: "USD",
          },
        ],
        // URLs a donde MP redirige después del pago
        back_urls: {
          success: `${BASE_URL}/success.html`,
          failure: `${BASE_URL}/index.html`,
          pending: `${BASE_URL}/index.html`,
        },
        statement_descriptor: "BILLETERAORDENADAUY",
      },
    });

    // Devuelve el link de pago al frontend
    res.json({ url: result.init_point });
  } catch (error) {
    console.error("Error creando preferencia de pago:", error);
    res.status(500).json({ error: "No se pudo crear el pago. Intentá de nuevo." });
  }
});

// ============================================================
// RUTA: Devuelve el link de Google Drive al frontend
// Así podés cambiarlo desde las variables de entorno
// sin tocar ningún archivo de código
// ============================================================
app.get("/drive-link", (req, res) => {
  const link = process.env.DRIVE_LINK || "TU_LINK_DE_GOOGLE_DRIVE_AQUI";
  res.json({ url: link });
});

// ============================================================
// RUTA: Página de éxito (ya la sirve express.static)
// /success.html se muestra después del pago aprobado
// ============================================================
// ============================================================
// RUTA: Webhook e IPN de Mercado Pago
// ============================================================
app.post("/webhook", (req, res) => {
  console.log("Webhook recibido:", req.body);
  res.sendStatus(200);
});

app.get("/webhook", (req, res) => {
  console.log("IPN recibido:", req.query);
  res.sendStatus(200);
});
// --- Iniciar servidor ---
app.listen(PORT, () => {
  console.log(`✅ BilleteraOrdenadaUY corriendo en http://localhost:${PORT}`);
});
