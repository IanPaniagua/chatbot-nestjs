import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().default(4000),
  ADMIN_API_TOKEN: z.string().min(12).default('dev-admin-token-change-me'),
  DEFAULT_COMPANY_SLUG: z.string().min(1).default('base-whatsapp'),
  TWILIO_ACCOUNT_SID: z.string().optional().default(''),
  TWILIO_AUTH_TOKEN: z.string().optional().default(''),
  TWILIO_WHATSAPP_FROM: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  AI_CLASSIFICATION_ENABLED: z.coerce.boolean().default(false),
});

export type AppConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppConfig {
  return envSchema.parse(config);
}
