// Permet de bloquer le démarrage si une variable d'environnement manque --  (Section 7.3 du cours) 

import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(10),
});

export type Env = z.infer<typeof envSchema>;
