// Uniquement des requêtes SQL paramétrées ($1, $2...) sur le schéma identity

import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module.js';
import { CreateUserInput, User, UserRole, UserStatus } from './user.types.js';

type UserRow = {
  id: string;
  last_name: string;
  first_name: string;
  username: string | null;
  email: string;
  phone: string;
  profession: string;
  password_hash: string;
  roles: UserRole[];
  status: UserStatus;
  failed_login_attempts: number;
  locked_until: Date | null;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class UsersRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>(
      `SELECT * FROM identity.users WHERE LOWER(email) = LOWER($1)`,
      [email],
    );
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>(
      `SELECT * FROM identity.users
       WHERE LOWER(email) = LOWER($1) OR username = $1`,
      [identifier],
    );
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const { rows } = await this.pool.query<UserRow>(
      `SELECT * FROM identity.users WHERE phone = $1`,
      [phone],
    );
    return rows[0] ? toUser(rows[0]) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const { rows } = await this.pool.query<UserRow>(
      `INSERT INTO identity.users (
        last_name, first_name, username, email, phone, profession, password_hash, roles
      )
      VALUES ($1, $2, $3, LOWER($4), $5, $6, $7, $8)
      RETURNING *`,
      [
        input.lastName,
        input.firstName,
        input.username ?? null,
        input.email,
        input.phone,
        input.profession,
        input.passwordHash,
        [input.role],
      ],
    );
    return toUser(rows[0]!);
  }

  async recordFailedLogin(userId: string, attempts: number, lockedUntil: Date | null): Promise<void> {
    await this.pool.query(
      `UPDATE identity.users
       SET failed_login_attempts = $1, locked_until = $2, updated_at = NOW()
       WHERE id = $3`,
      [attempts, lockedUntil, userId],
    );
  }

  async resetFailedLogins(userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE identity.users
       SET failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = $1`,
      [userId],
    );
  }
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    lastName: row.last_name,
    firstName: row.first_name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    profession: row.profession,
    passwordHash: row.password_hash,
    roles: row.roles,
    status: row.status,
    failedLoginAttempts: row.failed_login_attempts,
    lockedUntil: row.locked_until,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
