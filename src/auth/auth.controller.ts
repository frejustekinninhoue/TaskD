// Les deux routes HTTP (POST /api/v1/auth/register et POST /api/v1/auth/login) 
// Avec leur documentation Swagger complète

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from '../users/user.types.js';
import { AuthService } from './auth.service.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Create a new delegator or collaborator account (US-03 / US-04)' })
  @ApiCreatedResponse({ type: AuthResponseDto, description: 'Account created successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Email or phone already in use' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.register(dto);
    return {
      accessToken,
      user: toUserProfileDto(user),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email or username (US-05)' })
  @ApiOkResponse({ type: AuthResponseDto, description: 'Authenticated successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiForbiddenResponse({ description: 'Account suspended' })
  @ApiTooManyRequestsResponse({ description: 'Account locked after 5 failed attempts' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.login(dto);
    return {
      accessToken,
      user: toUserProfileDto(user),
    };
  }
}

function toUserProfileDto(user: User) {
  return {
    id: user.id,
    lastName: user.lastName,
    firstName: user.firstName,
    email: user.email,
    phone: user.phone,
    profession: user.profession,
    roles: user.roles,
    createdAt: user.createdAt,
  };
}
