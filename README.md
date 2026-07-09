# WhatsApp Chatbot Platform

Base reutilizable para crear chatbots de WhatsApp para empresas. El core es multiempresa mediante `companyId`/`companySlug`; cada cliente se customiza con configuración, FAQs, mensajes y flujos.

## Stack

- API: NestJS + TypeScript
- DB: PostgreSQL + Prisma
- Canal inicial: Twilio WhatsApp
- Panel interno: Next.js
- Shared package: enums y tipos comunes

Guía de la base WhatsApp: [docs/whatsapp-chatbot-base.md](docs/whatsapp-chatbot-base.md)

Guía de Twilio WhatsApp: [docs/twilio-whatsapp-setup.md](docs/twilio-whatsapp-setup.md)

## Quickstart

Local con Docker Postgres:

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

API: `http://localhost:4000`

Admin: `http://localhost:3000`

Neon remoto:

```bash
npx -y neonctl env pull
npm run env:check
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm dev
```

Guía completa: [docs/neon-setup.md](docs/neon-setup.md)

## Scripts

- `pnpm dev`: arranca API y admin.
- `pnpm dev:api`: arranca solo NestJS.
- `pnpm dev:admin`: arranca solo Next.js.
- `pnpm build`: compila todos los paquetes.
- `npm test`: ejecuta los tests de API con Jest.
- `pnpm simulate:whatsapp "mensaje"`: simula un mensaje entrante de Twilio WhatsApp contra la API local.
- `npm run env:check`: valida `.env` antes de conectar a DB remota.
- `pnpm db:migrate`: aplica migraciones Prisma.
- `pnpm db:deploy`: aplica migraciones existentes en staging/producción.
- `pnpm db:studio`: abre Prisma Studio.
- `pnpm db:seed`: crea `base-whatsapp`, Beinetti y demo.

## Arquitectura MVP

- `apps/api`: backend NestJS, Prisma, webhooks y motor conversacional.
- `apps/admin`: panel interno básico para conversaciones.
- `packages/shared`: tipos compartidos entre API y panel.
- `.neon`: contexto del proyecto Neon enlazado. No contiene secretos; las credenciales viven en `.env`.

## Alcance MVP

Incluido:

- Core multiempresa.
- Contactos, conversaciones, mensajes y notas internas.
- Adaptador Twilio WhatsApp.
- Clasificación inicial por reglas configurables.
- Routing para consulta normal, solicitud a medida, cliente empresa, FAQ y humano.
- Seeds `base-whatsapp`, Beinetti y demo.
- Panel interno básico.
- Métricas operativas.

No incluido todavía:

- SaaS público con billing/onboarding.
- Integración Agora POS real.
- Voz.
- Agente IA avanzado autónomo.

## API MVP

- `POST /webhooks/twilio/whatsapp`
- `POST /webhooks/twilio/whatsapp?companySlug=postres-beinetti`
- `GET /companies`
- `GET /conversations?companyId=&status=&intent=`
- `GET /conversations/:id?companyId=`
- `PATCH /conversations/:id/status?companyId=`
- `POST /conversations/:id/internal-notes?companyId=`
- `GET /metrics/overview?companyId=`

Los endpoints internos requieren:

```http
Authorization: Bearer <ADMIN_API_TOKEN>
```

## Runbook mínimo

Si WhatsApp no responde:

1. Revisar que Twilio apunta a `/webhooks/twilio/whatsapp` o `/webhooks/twilio/whatsapp?companySlug=slug-del-cliente`.
2. Confirmar que `DEFAULT_COMPANY_SLUG` apunta a una empresa activa si no se usa `companySlug` en la URL.
3. Confirmar que `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_WHATSAPP_FROM` están definidos si se usa envío activo por API.
4. Revisar logs del backend para errores de webhook.
5. Confirmar que existe la empresa ejecutando `pnpm db:seed`.
6. Revisar en el panel si la conversación entró y quedó marcada como `needs_human`.

## Verificación actual

Comandos verificados en este workspace:

```bash
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm build
npm test
```

Nota: en este entorno, `pnpm test` puede fallar con `fetch failed` antes de ejecutar el script. `npm test` ejecuta el mismo test de Jest sin pasar por ese runner.
