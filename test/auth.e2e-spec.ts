/*
Respect à la lettre de la section 9.4 du cahier des charges : blocs describe avec 
le numéro de US en anglais, intitulés Given ... When ... Then ... 100 % en anglais, corps 
séparé par une ligne vide entre Given / When / Then, et un seul expect par test
*/

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { DomainErrorFilter } from '../src/common/domain-error.filter.js';
import { PG_POOL } from '../src/database/database.module.js';

describe('US-03 / US-04 / US-05 — Authentication API (HTTP)', () => {
  let app: INestApplication;
  let pool: Pool;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new DomainErrorFilter());
    await app.init();

    pool = moduleRef.get<Pool>(PG_POOL);
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE identity.users RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  it('Given valid delegator data, When registering, Then the API responds 201 Created', async () => {
    const payload = {
      lastName: 'DOSSOU',
      firstName: 'Jean',
      phone: '+2290197111111',
      email: 'jean.dossou@example.com',
      profession: 'Entrepreneur',
      password: 'Password123',
      role: 'delegator',
      acceptTerms: true,
    };

    const response = await request(app.getHttpServer()).post('/api/v1/auth/register').send(payload);

    expect(response.status).toBe(201);
  });

  it('Given an email already registered, When registering again, Then the API responds 409 Conflict', async () => {
    const payload = {
      lastName: 'DOSSOU',
      firstName: 'Jean',
      phone: '+2290197111111',
      email: 'jean.dossou@example.com',
      profession: 'Entrepreneur',
      password: 'Password123',
      role: 'delegator',
      acceptTerms: true,
    };
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(payload);

    const duplicateResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ ...payload, phone: '+2290197222222' });

    expect(duplicateResponse.status).toBe(409);
  });

  it('Given a registered user, When logging in with valid credentials, Then the API responds 200 OK', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      lastName: 'KOFFI',
      firstName: 'Amina',
      phone: '+2290197333333',
      email: 'amina@example.com',
      profession: 'Designer UI',
      password: 'Password123',
      role: 'collaborator',
      acceptTerms: true,
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'AMINA@example.com', password: 'Password123' });

    expect(loginResponse.status).toBe(200);
  });

  it('Given a registered user, When logging in with a wrong password, Then the API responds 401 Unauthorized', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      lastName: 'KOFFI',
      firstName: 'Amina',
      phone: '+2290197333333',
      email: 'amina@example.com',
      profession: 'Designer UI',
      password: 'Password123',
      role: 'collaborator',
      acceptTerms: true,
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'amina@example.com', password: 'WrongPassword1' });

    expect(loginResponse.status).toBe(401);
  });
});
