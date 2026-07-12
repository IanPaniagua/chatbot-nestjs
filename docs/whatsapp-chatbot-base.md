# Base de chatbot WhatsApp

Este repo ya funciona como base reutilizable para crear chatbots de WhatsApp para distintas empresas. La idea es mantener un core común y customizar solo la configuración de cada cliente.

## Qué incluye la base

- Entrada de mensajes por WhatsApp usando Twilio.
- Configuración multiempresa por `companySlug`.
- Contactos, conversaciones, mensajes, notas internas y métricas.
- Agente IA con guardrails deterministas.
- Catalogo de servicios por empresa.
- Opciones guiadas para meter al cliente en el funnel sin preguntas demasiado abiertas.
- Clasificación inicial por palabras clave configurables como fallback.
- Flujos conversacionales para recoger datos paso a paso.
- FAQ por configuración y por base de conocimiento.
- Derivación a humano cuando el bot no debe cerrar la conversación.
- Panel interno para revisar conversaciones.

## Empresa plantilla

El seed crea una empresa base:

```txt
slug: base-whatsapp
nombre: Base WhatsApp Chatbot
```

Esta empresa tiene mensajes neutros y dos flujos reutilizables:

- `special_order`: solicitud a medida o presupuesto.
- `restaurant_order`: consulta de empresa/B2B.

Para crear un cliente nuevo, duplica esa configuración en `apps/api/prisma/seed.ts`, cambia el `slug`, nombre, mensajes, keywords, FAQs y campos de los flujos.

## Webhook de WhatsApp

Twilio debe apuntar a:

```txt
POST https://TU-DOMINIO.com/webhooks/twilio/whatsapp
```

Por defecto, la API usa:

```env
DEFAULT_COMPANY_SLUG="base-whatsapp"
```

También puedes forzar un cliente concreto desde la URL:

```txt
POST https://TU-DOMINIO.com/webhooks/twilio/whatsapp?companySlug=slug-del-cliente
```

Esto permite usar el mismo backend para varias empresas.

## Variables clave

```env
DATABASE_URL="postgresql://..."
API_PORT=4000
ADMIN_API_TOKEN="token-largo"
DEFAULT_COMPANY_SLUG="base-whatsapp"

TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"

NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
ADMIN_SERVER_API_TOKEN="token-largo"
```

## Flujo de trabajo para un cliente nuevo

1. Definir objetivo principal del bot: captar leads, responder dudas, derivar, preparar propuestas o soporte.
2. Definir catalogo de servicios de la empresa.
3. Definir funnel por servicio: opciones guiadas, preguntas clave, datos obligatorios y criterio de handoff.
4. Crear config en admin o en `apps/api/prisma/seed.ts` mientras el onboarding visual no este completo.
5. Ejecutar `pnpm db:seed` si se ha cambiado seed.
6. Poner `DEFAULT_COMPANY_SLUG` al slug del cliente, o usar `?companySlug=...` en Twilio.
7. Probar mensajes tipicos: saludo, precio, servicio principal, duda frecuente, cambio de tema y hablar con humano.
8. Ajustar servicios, conocimiento, textos y campos hasta que la conversacion suene como la empresa.
9. Usar el panel interno para revisar conversaciones que queden en `needs_human`.

## Simular WhatsApp en local

Con la API arrancada:

```bash
pnpm dev:api
```

En otra terminal:

```bash
pnpm simulate:whatsapp "Hola, necesito un presupuesto personalizado"
```

También puedes probar un cliente concreto:

```bash
pnpm simulate:whatsapp --company=postres-beinetti "Quiero una tarta para 20 personas"
```

El script envía el mismo formato `application/x-www-form-urlencoded` que usa Twilio y muestra la respuesta del bot.

## Qué se customiza después

- Tono de voz y mensajes del bot.
- Catalogo de servicios.
- Objetivo principal de la conversacion.
- Funnel por servicio.
- Opciones guiadas y opciones de alcance/precio.
- Keywords de clasificación fallback.
- Preguntas frecuentes.
- Campos de cada flujo.
- Reglas de derivación humana.
- Integraciones reales: CRM, POS, email, calendario, pagos o ERP.

La regla sana es no tocar el core para cada cliente salvo que aparezca una capacidad nueva que deba servir a todos.

Para la vision completa de producto, ver [product-vision-multiempresa.md](product-vision-multiempresa.md).
