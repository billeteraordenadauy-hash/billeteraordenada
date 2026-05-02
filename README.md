# BilleteraOrdenadaUY 🇺🇾

Landing page + backend para vender el Kit de Finanzas Personales 2026.

---

## Estructura del proyecto

```
billeteraordenada/
├── .env.example       ← Modelo de variables de entorno
├── package.json       ← Dependencias del proyecto
├── server.js          ← Servidor Node.js + rutas de pago
└── public/
    ├── index.html     ← Landing page principal
    ├── style.css      ← Todos los estilos
    ├── script.js      ← Lógica del botón de pago y FAQ
    └── success.html   ← Página de descarga post-pago
```

---

## Configuración inicial

### 1. Instalá las dependencias
```bash
npm install
```

### 2. Creá tu archivo .env
```bash
cp .env.example .env
```
Abrí el archivo `.env` y completá:
- `MP_ACCESS_TOKEN` — tu token de Mercado Pago
- `BASE_URL` — la URL de tu sitio
- `DRIVE_LINK` — el link de tu carpeta de Google Drive

### 3. Corré el servidor en modo desarrollo
```bash
npm start
```
Abrí http://localhost:3000 en tu navegador.

---

## Cómo obtener tu token de Mercado Pago

1. Entrá a https://www.mercadopago.com.uy/developers/panel
2. Creá una aplicación
3. En la sección "Credenciales", copiá el **Access Token de producción**
4. Para probar antes de lanzar, usá el **Access Token de prueba** (TEST)

---

## Cómo preparar Google Drive

1. Subí todos los archivos del kit a una carpeta de Google Drive
2. Hacé clic derecho → "Compartir" → "Cualquier persona con el link puede ver"
3. Copiá el link y pegalo en la variable `DRIVE_LINK` de tu `.env`

---

## Deploy en Railway (recomendado, gratis)

1. Creá una cuenta en https://railway.app
2. Nuevo proyecto → "Deploy from GitHub repo"
3. Conectá tu repositorio
4. En "Variables", agregá las mismas variables de tu `.env`
5. Railway te da una URL pública automáticamente
6. Actualizá `BASE_URL` con esa URL

---

## Deploy en Render (alternativa gratis)

1. Creá una cuenta en https://render.com
2. Nuevo servicio → "Web Service"
3. Conectá tu repo
4. Build command: `npm install`
5. Start command: `node server.js`
6. Agregá las variables de entorno en el panel

---

## Checklist antes de lanzar

- [ ] Token de MP en modo PRODUCCIÓN (no TEST)
- [ ] `BASE_URL` apunta a tu URL pública real
- [ ] Link de Drive funciona y es accesible sin cuenta de Google
- [ ] Probaste el flujo completo de pago con tarjeta de prueba de MP
- [ ] Revisaste el sitio en celular

---

## Soporte

¿Dudas? Revisá la documentación de Mercado Pago:
https://www.mercadopago.com.uy/developers/es/docs/checkout-pro/landing
