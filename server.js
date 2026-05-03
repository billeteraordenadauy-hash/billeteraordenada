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
      },
    });
    res.json({ url: result.init_point, preferenceId: result.id });
  } catch (error) {
    console.error("Error creando preferencia de pago:", error);
    res.status(500).json({ error: "No se pudo crear el pago. Intentá de nuevo." });
  }
});

app.get("/drive-link", (req, res) => {
  const link = process.env.DRIVE_LINK || "";
  res.json({ url: link });
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  console.log("Webhook recibido:", JSON.stringify(req.body));
  const { type, data } = req.body;
  if (type === "payment" && data && data.id) {
    try {
      const response = await fetch(
        "https://api.mercadopago.com/v1/payments/" + data.id,
        {
          headers: {
            Authorization: "Bearer " + process.env.MP_ACCESS_TOKEN,
          },
        }
      );
      const payment = await response.json();
      if (payment.status === "approved") {
        const emailComprador = payment.payer && payment.payer.email;
        const driveLink = process.env.DRIVE_LINK || "";
        if (emailComprador) {
          await transporter.sendMail({
            from: '"BilleteraOrdenadaUY" <billeteraordenadauy@gmail.com>',
            to: emailComprador,
            subject: "Tu Kit de Finanzas Personales 2026 esta listo",
            html: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;"><h1 style="color:#2D5016;">Gracias por tu compra!</h1><p>Tu Kit de Finanzas Personales 2026 esta listo para descargar.</p><a href="' + driveLink + '" style="display:inline-block;background:#2D5016;color:white;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:bold;margin:16px 0;">Descargar mi kit ahora</a><p style="color:#666;font-size:14px;">Si el boton no funciona, copia este link:<br/><a href="' + driveLink + '">' + driveLink + '</a></p><p style="color:#999;font-size:12px;">BilleteraOrdenadaUY</p></div>',
          });
          console.log("Mail enviado a:", emailComprador);
        }
      }
    } catch (error) {
      console.error("Error en webhook:", error);
    }
  }
});

app.get("/webhook", (req, res) => {
  res.sendStatus(200);
});

app.listen(PORT, function() {
  console.log("BilleteraOrdenadaUY corriendo en puerto " + PORT);
});
