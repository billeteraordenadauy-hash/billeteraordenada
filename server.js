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
  }, 10 * 60 * 1000);
}

function obtenerComprador(preferenceId) {
  const comprador = compradores[preferenceId];
  if (!comprador) return null;
  // Verificar que no hayan pasado mas de 10 minutos
  if (Date.now() - comprador.timestamp > 10 * 60 * 1000) {
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
  parts.push('<h1 style="color:#2D5016;">Hola ' + nombre + '!</h1>');
  parts.push('<p>Bienvenido/a a la familia BilleteraOrdenadaUY! Tu kit ya esta listo y te va a cambiar la forma en que manejas tu plata.</p>');
  parts.push('<h2 style="color:#2D5016;">Que incluye tu kit?</h2>');
  parts.push('<p><strong>Planilla Maestra de Finanzas 2026</strong> - Tu centro de control. Registra gastos diarios, segui tus ahorros y objetivos en un solo lugar.</p>');
  parts.push('<p><strong>Control de Gastos Anual - Excel</strong> - Vision anual completa. Ideal para la computadora.</p>');
  parts.push('<p><strong>Control de Gastos Anual - Google Sheets</strong> - Lo mismo pero desde el celular, sin instalar nada.</p>');
  parts.push('<p><strong>Checklist de Salud Financiera</strong> - Descubri en que zona estas: roja, amarilla o verde.</p>');
  parts.push('<p><strong>Guia del Recibo de Sueldo</strong> - Entende que te descuentan: BPS, FONASA, IRPF y mas.</p>');
  parts.push('<p><strong>Planners Personales</strong> - Para organizarte dia a dia y semana a semana.</p>');
  parts.push('<h2 style="color:#2D5016;">Como empezar?</h2>');
  parts.push('<ol>');
  parts.push('<li>Hace clic en el boton o ingresa en el link</li>');
  parts.push('<li>Abri la carpeta y elegi el archivo que mas se adapta a vos</li>');
  parts.push('<li>Realiza una copia para editarlo desde tu Excel o Google Sheets</li>');
  parts.push('<li>Empieza a ordenar tu billetera hoy mismo!</li>');
  parts.push('</ol>');
  parts.push('<a href="' + driveLink + '" style="display:inline-block;background:#2D5016;color:white;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:bold;margin:16px 0;">Acceder a mi kit ahora</a>');
  parts.push('<p style="color:#666;font-size:14px;">Si el boton no funciona, copia este link: ' + driveLink + '</p>');
  parts.push('<p>Seguinos en Instagram <strong>@billeteraordenadauy</strong> para mas tips. Y si tenes dudas, responde este mail y te ayudamos.</p>');
  parts.push('<p style="color:#999;font-size:12px;">BilleteraOrdenadaUY - Material educativo e informativo - Uruguay 2026</p>');
  parts.push('</div>');
  return parts.join('');
}

async function enviarMailKit(nombre, email) {
  const driveLink = "https://drive.google.com/drive/folders/1wg65nq_RGKonHBRVTHoVpYvmKMNZReKV?usp=sharing";
  const { error } = await resend.emails.send({
    from: "BilleteraOrdenadaUY <hola@billeteraordenada.com>",
    to: email,
    subject: "Tu Kit de Finanzas Personales 2026 esta listo!",
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
