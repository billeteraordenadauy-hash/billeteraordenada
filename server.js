// ============================================================
// BilleteraOrdenadaUY — Servidor principal
// Maneja la creación de pagos con Mercado Pago
// ============================================================

require("dotenv").config();
const express = require("express");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const nodemailer = require("nodemailer");

// Configuración de Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "billeteraordenadauy@gmail.com",
    pass: process.env.GMAIL_PASS || "yuux tobv huab cduh",
  },
});
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

const BASE_URL = process.env.BASE_URL || "https://billeteraordenada-production.up.railway.app";
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
    res.json({ url: result.init_point, preferenceId: result.id });
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
// RUTA: Webhook de Mercado Pago
// Cuando el pago es aprobado, envía el mail con el link
// ============================================================
app.post("/webhook", express.json(), async (req, res) => {
  res.sendStatus(200);
  
  const { type, data } = req.body;
  
  if (type === "payment" && data?.id) {
    try {
      // Obtener detalles del pago desde MP
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${data.id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN || "TU_ACCESS_TOKEN_AQUI"}`,
          },
        }
      );
      const payment = await response.json();

      // Solo enviar mail si el pago fue aprobado
      if (payment.status === "approved") {
        const emailComprador = payment.payer?.email;
        const driveLink = process.env.DRIVE_LINK || "TU_LINK_DE_GOOGLE_DRIVE_AQUI";

        if (emailComprador) {
          await transporter.sendMail({
            from: '"BilleteraOrdenadaUY" <billeteraordenadauy@gmail.com>',
            to: emailComprador,
            subject: "🎉 Tu Kit de Finanzas Personales 2026 está listo",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <h1 style="color: #2D5016;">¡Gracias por tu compra! 🎉</h1>
                <p>Tu Kit de Finanzas Personales 2026 está listo para descargar.</p>
                <a href="${driveLink}" 
                   style="display:inline-block; background:#2D5016; color:white; padding:14px 28px; border-radius:50px; text-decoration:none; font-weight:bold; margin: 16px 0;">
                  📥 Descargar mi kit ahora
                </a>
                <p style="color: #666; font-size: 14px;">
                  Si el botón no funciona, copiá este link en tu navegador:<br/>
                  <a href="${driveLink}">${driveLink}</a>
                </p>
                <p style="color: #666; font-size: 14px;">
                  ¿Tenés alguna duda? Escribinos por Instagram.<br/>
                  ¡Mucho éxito organizando tus finanzas! 💚
                </p>
                <p style="color: #999; font-size: 12px;">BilleteraOrdenadaUY · Material educativo e informativo</p>
              </div>
            `,
          });
          console.log("✅ Mail enviado a:", emailComprador);
        }
      }
    } catch (error) {
      console.error("Error procesando webhook:", error);
    }
  }
});

app.get("/webhook", (req, res) => {
  console.log("IPN recibido:", req.query);
  res.sendStatus(200);
});
// --- Iniciar servidor ---
app.listen(PORT, () => {
  console.log(`✅ BilleteraOrdenadaUY corriendo en http://localhost:${PORT}`);
});
