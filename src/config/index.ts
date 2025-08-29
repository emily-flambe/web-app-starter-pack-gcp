import { z, ZodError } from 'zod';

/**
 * Environment configuration with runtime validation
 * Ensures all required environment variables are present and valid
 */

const envSchema = z.object({
  // API Configuration
  API_URL: z.string().url().default('http://localhost:8787'),

  // Feature Flags
  ENABLE_ANALYTICS: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  ENABLE_ERROR_TRACKING: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),

  // App Configuration
  APP_NAME: z.string().default('Web App Starter Pack'),
  APP_VERSION: z.string().default('1.0.0'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  IS_PRODUCTION: z.boolean(),
  IS_DEVELOPMENT: z.boolean(),
});

// Parse and validate environment variables
const parseEnv = () => {
  const env = {
    API_URL: import.meta.env.VITE_API_URL,
    ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
    ENABLE_ERROR_TRACKING: import.meta.env.VITE_ENABLE_ERROR_TRACKING,
    APP_NAME: import.meta.env.VITE_APP_NAME,
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    NODE_ENV: import.meta.env.MODE as 'development' | 'production' | 'test',
    IS_PRODUCTION: import.meta.env.PROD,
    IS_DEVELOPMENT: import.meta.env.DEV,
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof ZodError) {
      const missingVars = error.issues.map((e) => e.path.join('.')).join(', ');
      throw new Error(
        `Missing or invalid environment variables: ${missingVars}\n` +
          `Please check your .env.local file and ensure all required variables are set.`
      );
    }
    throw error;
  }
};

// Export validated configuration
export const config = parseEnv();

// Type-safe config access
export type Config = z.infer<typeof envSchema>;
