# Neon Setup

Use Neon as the first remote Postgres database for staging/demo and later for Postres Beinetti production.

## Recommended Environments

- Local development: Docker Postgres from `docker-compose.yml`.
- Staging/demo: Neon Free.
- Production: Neon Launch or another paid Neon setup billed as an external cost to the client.

## Current Project

This workspace is linked through `.neon` to:

- Neon project: `chatbot-nestjs`
- Project ID: `jolly-dew-46624700`
- Branch: `production`
- Region: `aws-eu-central-1`

The `.neon` file contains project context only, not database passwords.

## Pull Local Environment

```bash
npx -y neonctl env pull
```

This writes Neon-managed variables to `.env`, including `DATABASE_URL`. The `.env` file is ignored by git and must never be committed.

If setting up another machine manually, copy the template first:

```bash
cp .env.neon.example .env
```

Then edit `.env` and set at minimum:

```bash
DATABASE_URL="paste-neon-connection-string-here"
ADMIN_API_TOKEN="generate-a-long-random-token"
ADMIN_SERVER_API_TOKEN="same-value-as-admin-api-token"
```

Generate a token:

```bash
openssl rand -base64 32
```

## Validate And Migrate

```bash
npm run env:check
pnpm db:generate
pnpm db:deploy
pnpm db:seed
```

The Prisma scripts run through `scripts/with-root-env.mjs`, so they read the monorepo root `.env` even though Prisma lives under `apps/api`.

For local development with Docker Postgres, use:

```bash
docker compose up -d
pnpm db:migrate
pnpm db:seed
```

## Run The App

```bash
pnpm dev
```

API: `http://localhost:4000`

Admin: `http://localhost:3000`

## Notes

- Use `pnpm db:migrate` for local development because it creates new migration files.
- Use `pnpm db:deploy` for Neon/staging/production because it applies existing migrations safely.
- Do not commit `.env`.
- Do not paste real credentials into docs, screenshots, commits, or client decks.
