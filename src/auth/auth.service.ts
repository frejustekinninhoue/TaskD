// Toute la logique métier (hachage bcrypt, génération du JWT, blocage après 5 échecs pendant 15 min)

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.types.js';
import { UsersRepository } from '../users/users.repository.js';
import {
  AccountLockedError,
  AccountSuspendedError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  PhoneAlreadyExistsError,
} from './auth.errors.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: User }> {
    const existingEmail = await this.usersRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new EmailAlreadyExistsError();
    }

    const existingPhone = await this.usersRepository.findByPhone(dto.phone);
    if (existingPhone) {
      throw new PhoneAlreadyExistsError();
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersRepository.create({
      lastName: dto.lastName,
      firstName: dto.firstName,
      email: dto.email,
      phone: dto.phone,
      profession: dto.profession,
      passwordHash,
      role: dto.role,
    });

    const accessToken = await this.signToken(user);
    return { accessToken, user };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: User }> {
    const user = await this.usersRepository.findByEmailOrUsername(dto.identifier);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (user.status === 'suspended') {
      throw new AccountSuspendedError();
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedError();
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      const nextAttempts = user.failedLoginAttempts + 1;
      const lockedUntil = nextAttempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_DURATION_MS) : null;
      await this.usersRepository.recordFailedLogin(user.id, nextAttempts, lockedUntil);

      if (lockedUntil) {
        throw new AccountLockedError();
      }
      throw new InvalidCredentialsError();
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.usersRepository.resetFailedLogins(user.id);
    }

    const accessToken = await this.signToken(user);
    return { accessToken, user };
  }

  private async signToken(user: User): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
  }
}
