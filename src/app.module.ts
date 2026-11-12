// Avant de coder l'inscription et la connexion, branchement does fondations entre les deux fichiers -- app.module.ts et main.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { envSchema } from './config/env.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    DatabaseModule,
    AuthModule,
  ],
})
export class AppModule {}
