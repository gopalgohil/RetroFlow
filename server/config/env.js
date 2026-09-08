import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI must be defined in environment variables'),
  JWT_SECRET: z.string().default('retroflow_super_secret_jwt_key_development_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().optional().default('support@retroflow.app'),
  BREVO_SENDER_NAME: z.string().optional().default('RetroFlow'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('\n❌ [Config Error] Invalid Environment Variables Configuration:');
  parsedEnv.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  console.error('\nPlease verify your server/.env file.\n');
  // Allow running in dev with fallback defaults if MONGODB_URI exists
}

export const env = parsedEnv.success ? parsedEnv.data : process.env;

export default env;
