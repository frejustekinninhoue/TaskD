// Uniquement des requêtes SQL paramétrées ($1, $2...) sur le schéma identity

import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';

@Module({
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
