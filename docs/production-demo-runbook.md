# Runbook de demo en produccion

Objetivo: tener una demo estable para cliente sin depender del portatil, ngrok ni Cloudflare quick tunnel.

## Prioridad

La prioridad ahora es estabilidad operativa, no nuevas features:

1. API con URL HTTPS estable.
2. Twilio apuntando a esa URL estable.
3. Base de datos Neon ya migrada y sembrada.
4. Admin accesible para revisar conversaciones.
5. Prueba end-to-end desde WhatsApp real antes de enseñar la demo.

Los botones reales de WhatsApp quedan en backlog. La demo inicial usa listas numeradas robustas.

## Arquitectura recomendada para demo

- DB: Neon `production`.
- API NestJS: servicio Node con dominio tipo `https://api.tu-dominio.com`.
- Admin Next.js: servicio web con dominio tipo `https://admin.tu-dominio.com`.
- Twilio WhatsApp Sandbox o numero aprobado apuntando al webhook de la API.

Se puede usar cualquier proveedor que soporte Node y variables de entorno. Para ir rapido:

- API: Render, Railway, Fly.io o similar.
- Admin: Vercel, Render, Railway o similar.

## Variables de entorno de API

```env
DATABASE_URL="postgresql://..."
API_PORT=4000
ADMIN_API_TOKEN="token-largo"
DEFAULT_COMPANY_SLUG="tech-presence-matters"

OPENAI_API_KEY="..."
OPENAI_MODEL="..."
AI_AGENT_ENABLED=true
AI_CLASSIFICATION_ENABLED=false

TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_WHATSAPP_FROM` solo son necesarios para enviar mensajes proactivos/manuales por API. Para responder al webhook entrante con TwiML, no son imprescindibles.

## Variables de entorno de admin

```env
NEXT_PUBLIC_API_BASE_URL="https://api.tu-dominio.com"
ADMIN_SERVER_API_TOKEN="mismo-token-que-ADMIN_API_TOKEN"
```

## Comandos de build

Desde la raiz del monorepo:

```bash
pnpm install
pnpm db:generate
pnpm build
```

API:

```bash
pnpm --filter @chatbot/shared build
pnpm --filter @chatbot/api build
pnpm --filter @chatbot/api start
```

Render build command recomendado para la API:

```bash
pnpm install --frozen-lockfile && pnpm --filter @chatbot/shared build && pnpm db:generate && pnpm --filter @chatbot/api build
```

Render define `PORT` automaticamente. Si se usa `API_PORT`, configurarlo como `10000`.

Admin:

```bash
pnpm --filter @chatbot/admin build
pnpm --filter @chatbot/admin start
```

## Preparar DB remota

Antes de conectar Twilio:

```bash
pnpm db:generate
pnpm db:deploy
pnpm db:seed
```

Validar:

```bash
npm run env:check
```

## Configurar Twilio

En Twilio WhatsApp Sandbox o numero aprobado:

```txt
When a message comes in:
https://api.tu-dominio.com/webhooks/twilio/whatsapp?companySlug=tech-presence-matters

Method:
POST
```

## Prueba end-to-end

1. Enviar desde WhatsApp real: `Hola`.
2. Confirmar que llega una respuesta del bot.
3. Confirmar en el admin que aparece la conversacion.
4. Probar una solicitud:

```txt
Quiero un chatbot para WhatsApp
```

5. Confirmar que el bot guia con opciones y no inventa precios.
6. Probar handoff:

```txt
quiero hablar con una persona
```

7. Confirmar que queda como `needs_human`.

## Checklist antes de ensenar al cliente

- `main` esta limpio y subido a GitHub.
- `pnpm build` pasa.
- `npm test` pasa.
- API responde en `/webhooks/twilio/whatsapp`.
- Twilio logs muestran HTTP 200 en el ultimo mensaje.
- Admin carga conversaciones.
- `DEFAULT_COMPANY_SLUG` apunta al cliente correcto.
- El prompt/configuracion de `tech-presence-matters` esta sembrado en DB.
- Hay una conversacion de prueba limpia reciente.

## Fallback si algo falla durante la demo

- Si WhatsApp no responde, mirar primero Twilio logs.
- Si Twilio muestra 4xx/5xx, mirar logs de API.
- Si API no recibe nada, revisar URL webhook y metodo POST.
- Si responde texto raro, revisar `companySlug` y seed.
- Si admin no carga, revisar `NEXT_PUBLIC_API_BASE_URL` y `ADMIN_SERVER_API_TOKEN`.
