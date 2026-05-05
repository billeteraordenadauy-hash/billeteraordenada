require("dotenv").config();
const express = require("express");
const mercadopago = require("mercadopago");
const MercadoPagoConfig = mercadopago.MercadoPagoConfig;
const Preference = mercadopago.Preference;
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "billeteraordenadauy@gmail.com",
    pass: process.env.GMAIL_PASS,
  },
});

app.use(express.json());
app.use(express.static("public"));
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  next();
});

app.post("/crear-pago", async (req, res) => {
  try {
    const BASE_URL = process.env.BASE_URL || "https://billeteraordenada-production.up.railway.app";
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: "kit-finanzas-2026",
            title: "Kit de Finanzas Personales 2026 - BilleteraOrdenadaUY",
            description: "Planillas para organizar tus finanzas personales en Uruguay.",
            quantity: 1,
            unit_price: 8,
            currency_id: "USD",
          },
        ],
        back_urls: {
          success: BASE_URL + "/success.html",
          failure: BASE_URL + "/index.html",
          pending: BASE_URL + "/index.html",
        },
        notification_url: "https://billeteraordenada-production.up.railway.app/mp-webhook-notify",
      },
    });
    res.json({ url: result.init_point, preferenceId: result.id });
  } catch (error) {
    console.error("Error creando preferencia de pago:", error);
    res.status(500).json({ error: "No se pudo crear el pago. Intenta de nuevo." });
  }
});

app.get("/drive-link", (req, res) => {
  const link = process.env.DRIVE_LINK || "";
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

app.get("/enviar-kit", (req, res) => {
  const nombre = req.query.nombre;
  const email = req.query.email;
  const driveLink = process.env.DRIVE_LINK || "";

  if (!nombre || !email) {
    return res.json({ ok: false });
  }

  // Responder INMEDIATAMENTE antes de enviar el mail
  res.json({ ok: true });

  // Enviar mail en segundo plano sin bloquear
  transporter.sendMail({
    from: '"BilleteraOrdenadaUY" <billeteraordenadauy@gmail.com>',
    to: email,
    subject: "Tu Kit de Finanzas Personales 2026 esta listo!",
    html: buildEmailHtml(nombre, driveLink),
  }).then(function() {
    console.log("Mail enviado a:", email);
  }).catch(function(error) {
    console.error("Error enviando mail:", error.message);
  });
});

app.post("/mp-webhook-notify", (req, res) => {
  res.sendStatus(200);
});

app.get("/mp-webhook-notify", (req, res) => {
  res.sendStatus(200);
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
