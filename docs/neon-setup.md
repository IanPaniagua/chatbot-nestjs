# Neon Setup

Use Neon as the first remote Postgres database for staging/demo and later for Postres Beinetti production.

## Recommended Environments

- Local development: Docker Postgres from `docker-compose.yml`.
- Staging/demo: Neon Free.
- Production: Neon Launch or another paid Neon setup billed as an external cost to the client.

## Create The Neon Database

1. Go to [Neon](https://neon.com/) and create a project.
2. Suggested project name: `chatbot-platform-staging`.
3. Region: choose the closest European region available.
4. Database name: `chatbot`.
5. Copy the **pooled** connection string if Neon offers one.
6. Make sure the URL includes `sslmode=require`.

Example shape:

```bash
postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/chatbot?sslmode=require&pgbouncer=true
```

## Configure Local `.env`

```bash
cp .env.neon.example .env
```

Then edit `.env`:

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
