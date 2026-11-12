

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'frejuste@example.com', description: 'Email ou nom d utilisateur' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({ example: 'TaskD2026' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
