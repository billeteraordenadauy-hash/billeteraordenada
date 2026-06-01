require("dotenv").config();
const express = require("express");
const mercadopago = require("mercadopago");
const MercadoPagoConfig = mercadopago.MercadoPagoConfig;
const Preference = mercadopago.Preference;
const Payment = mercadopago.Payment;
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 3000;

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const resend = new Resend(process.env.RESEND_API_KEY || "placeholder");

// Base de datos en memoria con expiracion de 10 minutos
const compradores = {};

function guardarComprador(preferenceId, nombre, email) {
  compradores[preferenceId] = { nombre, email, timestamp: Date.now() };
  // Eliminar automaticamente despues de 10 minutos
  setTimeout(function() {
    delete compradores[preferenceId];
    console.log("Comprador expirado:", preferenceId);
  }, 60 * 60 * 1000);
}

function obtenerComprador(preferenceId) {
  const comprador = compradores[preferenceId];
  if (!comprador) return null;
  // Verificar que no hayan pasado mas de 10 minutos
  if (Date.now() - comprador.timestamp > 60 * 60 * 1000) {
    delete compradores[preferenceId];
    return null;
  }
  return comprador;
}

app.use(express.json());
app.use(express.static("public"));
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  next();
});

app.post("/crear-pago", async (req, res) => {
  try {
    const BASE_URL = process.env.BASE_URL || "https://billeteraordenada-production.up.railway.app";
    const nombre = req.body.nombre;
    const email = req.body.email;
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: "kit-finanzas-2026",
            title: "Kit de Finanzas Personales 2026 - BilleteraOrdenadaUY",
            description: "Planillas para organizar tus finanzas personales en Uruguay.",
            quantity: 1,
            unit_price: 380,
            currency_id: "UYU",
          },
        ],
        back_urls: {
          success: BASE_URL + "/success.html",
          failure: BASE_URL + "/failure.html",
          pending: BASE_URL + "/failure.html",
        },
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" },
            { id: "bank_transfer" },
            { id: "atm" }
          ]
        },
        notification_url: "https://billeteraordenada-production.up.railway.app/mp-webhook-notify",
      },
    });

    if (nombre && email) {
      guardarComprador(result.id, nombre, email);
      console.log("Comprador guardado:", result.id, nombre, email);
    }

    res.json({ url: result.init_point, preferenceId: result.id });
  } catch (error) {
    console.error("Error creando preferencia de pago:", error);
    res.status(500).json({ error: "No se pudo crear el pago. Intenta de nuevo." });
  }
});

app.get("/drive-link", (req, res) => {
  const link = "https://drive.google.com/drive/folders/1wg65nq_RGKonHBRVTHoVpYvmKMNZReKV?usp=sharing";
  res.json({ url: link });
});

function buildEmailHtml(nombre, driveLink) {
  var parts = [];
  parts.push('<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FAFAF7;border-radius:16px;">');
  parts.push('<h1 style="color:#2D5016;">Hola ' + nombre + '! 👋</h1>');
  parts.push('<p>Tu Kit de Finanzas Personales 2026 ya está listo. Antes de abrirlo, leé esto — te ahorra 10 minutos de confusión:</p>');
  parts.push('<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:16px 0;">');
  parts.push('<p style="margin:0 0 8px;font-weight:bold;">⚠️ IMPORTANTE — leé antes de abrir</p>');
  parts.push('<p style="margin:0 0 8px;">📥 <strong>Descargá los archivos para poder editarlos</strong></p>');
  parts.push('<p style="margin:0 0 4px;">Los archivos se abren en modo solo lectura. Para editarlos:</p>');
  parts.push('<ul style="margin:8px 0;padding-left:20px;">');
  parts.push('<li><strong>Excel:</strong> descargalo → abrilo → clic en "Habilitar edición"</li>');
  parts.push('<li><strong>Google Sheets:</strong> abrilo → Archivo → Hacer una copia</li>');
  parts.push('</ul>');
  parts.push('</div>');
  parts.push('<div style="text-align:center;margin:24px 0;">');
  parts.push('<a href="' + driveLink + '" style="display:inline-block;background:#2D5016;color:white;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:bold;font-size:16px;">👇 Acceder a mi kit ahora</a>');
  parts.push('</div>');
  parts.push('<p style="color:#666;font-size:13px;text-align:center;">Si el botón no funciona, copiá este link: <a href="' + driveLink + '" style="color:#2D5016;">' + driveLink + '</a></p>');
  parts.push('<h2 style="color:#2D5016;">¿Qué viene en el kit?</h2>');
  parts.push('<p>📊 <strong>Planilla Maestra</strong> — dashboard, gastos, ahorro y objetivos</p>');
  parts.push('<p>📊 <strong>Control Anual para Excel</strong> — visión completa del año</p>');
  parts.push('<p>🌐 <strong>Control Anual para Google Sheets</strong> — desde el celular, sin instalar nada</p>');
  parts.push('<p>✅ <strong>Checklist de Salud Financiera</strong> — descubrí si estás en zona roja, amarilla o verde</p>');
  parts.push('<p>📄 <strong>Guía del Recibo de Sueldo</strong> — entendé qué te descuentan: BPS, FONASA, IRPF y más</p>');
  parts.push('<p>🗓️ <strong>Plan financiero personal</strong> — para organizarte día a día y semana a semana</p>');
  parts.push('<p>🗓️ <strong> Actualizaciones mensaules y planillas extras!</strong> — para organizarte día a día y semana a semana</p>');
  parts.push('<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">');
  parts.push('<p>Seguinos en Instagram <strong>@billeteraordenadauy</strong> para tips semanales de finanzas personales. 🇺🇾</p>');
  parts.push('<p>¿Dudas? Respondé este mail y te contestamos en menos de 24 horas.</p>');
  parts.push('<p style="color:#999;font-size:12px;">BilleteraOrdenadaUY · Material educativo e informativo · Uruguay 2026</p>');
  parts.push('</div>');
  return parts.join('');
}
async function enviarMailKit(nombre, email) {
  const driveLink = "https://drive.google.com/drive/folders/1wg65nq_RGKonHBRVTHoVpYvmKMNZReKV?usp=sharing";
  const { error } = await resend.emails.send({
    from: "BilleteraOrdenadaUY <kit@billeteraordenada.com>",
    to: email,
    subject: "🎉 Tu kit está listo — leé esto antes de abrirlo",
    html: buildEmailHtml(nombre, driveLink),
  });
  if (error) throw new Error(error.message);
  console.log("Mail enviado a:", email);
}

// Webhook de Mercado Pago - envia mail automaticamente
app.post("/mp-webhook-notify", async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    console.log("Webhook recibido:", JSON.stringify(body));

    if (body.type === "payment" && body.data && body.data.id) {
      const paymentId = body.data.id;
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      console.log("Pago status:", paymentData.status, "preference:", paymentData.preference_id);

      if (paymentData.status === "approved" && paymentData.preference_id) {
        const comprador = obtenerComprador(paymentData.preference_id);
        if (comprador) {
          await enviarMailKit(comprador.nombre, comprador.email);
          delete compradores[paymentData.preference_id];
          console.log("Mail enviado via webhook a:", comprador.email);
        } else {
          console.log("Comprador no encontrado para preference:", paymentData.preference_id);
        }
      }
    }
  } catch (err) {
    console.error("Error en webhook:", err.message);
  }
});

app.get("/mp-webhook-notify", (req, res) => {
  res.sendStatus(200);
});

// Ruta para confirmar pago desde success.html (respaldo)
app.get("/confirmar-pago", async (req, res) => {
  const preferenceId = req.query.preference_id;
  const status = req.query.status;
  const driveLink = "https://drive.google.com/drive/folders/1wg65nq_RGKonHBRVTHoVpYvmKMNZReKV?usp=sharing";

  res.json({ ok: true, driveLink: driveLink });

  if (status === "approved" && preferenceId) {
    const comprador = obtenerComprador(preferenceId);
    if (comprador) {
      try {
        await enviarMailKit(comprador.nombre, comprador.email);
        delete compradores[preferenceId];
      } catch (err) {
        console.error("Error enviando mail desde confirmar-pago:", err.message);
      }
    }
  }
});

// Ruta para enviar mail manual desde success.html
app.get("/enviar-kit", async (req, res) => {
  const nombre = req.query.nombre;
  const email = req.query.email;

  if (!nombre || !email) {
    return res.json({ ok: false });
  }

  try {
    await enviarMailKit(nombre, email);
    res.json({ ok: true });
  } catch (error) {
    console.error("Error enviando mail:", error.message);
    res.json({ ok: false });
  }
});

app.post("/webhook", (req, res) => {
  res.sendStatus(200);
});

app.get("/webhook", (req, res) => {
  res.sendStatus(200);
});

app.listen(PORT, function() {
  console.log("BilleteraOrdenadaUY corriendo en puerto " + PORT);
});
