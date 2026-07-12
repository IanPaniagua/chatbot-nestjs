# Twilio WhatsApp setup

Objetivo: probar un WhatsApp real entrando por Twilio, respondiendo desde la API y apareciendo en el admin.

## 1. Requisitos

- API corriendo en `http://localhost:4000`.
- Admin corriendo en `http://localhost:3000`.
- Neon conectado y seed aplicado.
- Una URL pública HTTPS hacia la API local.
- Una cuenta Twilio con WhatsApp Sandbox activado.

Para mensajes entrantes y respuesta inmediata por TwiML no hacen falta `TWILIO_ACCOUNT_SID` ni `TWILIO_AUTH_TOKEN`. Esas credenciales serán necesarias para envíos proactivos fuera del webhook.

## 2. Crear URL pública

Twilio no puede llamar a `localhost`. En local usa un túnel:

```bash
ngrok http 4000
```

Si no tienes cuenta o authtoken de ngrok, usa Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:4000
```

El túnel mostrará una URL parecida a:

```txt
https://abc123.trycloudflare.com
```

El webhook completo será:

```txt
https://abc123.trycloudflare.com/webhooks/twilio/whatsapp?companySlug=base-whatsapp
```

Importante: ngrok y Cloudflare quick tunnels son solo para desarrollo o demos. Pueden cambiar de URL, caerse o quedarse reconectando. Para vender el bot o usarlo con clientes reales, el webhook debe vivir en una URL HTTPS estable de produccion.

También puedes cambiar `companySlug`:

```txt
https://abc123.trycloudflare.com/webhooks/twilio/whatsapp?companySlug=clinica-demo
```

## 2.1. Demo de cliente / produccion inicial

Para enseñar la demo a un cliente sin sustos, evita depender de una URL `trycloudflare.com` o `ngrok` temporal. El objetivo minimo es:

- API desplegada con URL HTTPS estable.
- `DATABASE_URL`, `ADMIN_API_TOKEN`, `DEFAULT_COMPANY_SLUG`, `OPENAI_API_KEY`, `OPENAI_MODEL` y `AI_AGENT_ENABLED` configurados en el entorno de despliegue.
- Twilio apuntando a la URL estable:

```txt
https://api.tu-dominio.com/webhooks/twilio/whatsapp?companySlug=tech-presence-matters
```

- Admin desplegado y protegido para revisar conversaciones.
- Prueba end-to-end desde WhatsApp real antes de enseñar la demo.

Botones reales de WhatsApp quedan para una fase posterior. La version actual usa listas numeradas con fallback robusto, que es mejor para salir a demo estable cuanto antes.

## 3. Configurar Twilio Sandbox

En Twilio Console:

1. Abre WhatsApp Sandbox.
2. Activa el Sandbox si aún no está activo.
3. Únete desde tu móvil enviando el mensaje `join ...` que Twilio te muestra al número del Sandbox.
4. En `Sandbox settings` -> `Sandbox configuration`, pega esta URL en `When a message comes in`.
5. Método: `POST`.
6. Guarda.

## 4. Probar

Desde WhatsApp, envía un mensaje al número del Sandbox:

```txt
Hola, necesito un presupuesto personalizado
```

Resultado esperado:

- Twilio llama a `POST /webhooks/twilio/whatsapp`.
- La API responde con TwiML.
- WhatsApp recibe la respuesta del bot.
- El admin muestra la conversación.

## 5. Troubleshooting

Si no responde:

- Revisa que `ngrok` sigue abierto.
- Si usas Cloudflare quick tunnel, revisa que no este reconectando en bucle.
- Revisa que la URL de Twilio sea `https`, no `http`.
- Revisa que la API escucha en `4000`.
- Revisa que el método sea `POST`.
- Revisa el `companySlug`.
- En Twilio, abre los logs del mensaje para ver el código HTTP del webhook.

Si la API local responde pero WhatsApp no, casi siempre el problema esta entre Twilio y la URL publica: tunnel cerrado, URL antigua en Twilio, metodo incorrecto o `companySlug` incorrecto.

Fuente oficial: https://www.twilio.com/docs/whatsapp/sandbox
