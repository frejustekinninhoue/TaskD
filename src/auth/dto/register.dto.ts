// Les DTO
/*
valident strictement les règles des US-03, US-04 et US-05 
(téléphone international +229..., mot de passe ≥ 8 caractères avec lettre et chiffre, acceptation des 
CGU, suppression des espaces avec .trim())
*/

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'DOSSOU' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: 'Fréjuste' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: '+2290197000000' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'Le téléphone doit être au format international (ex. +2290197000000)',
  })
  phone!: string;

  @ApiProperty({ example: 'frejuste@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Développeur Backend' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  profession!: string;

  @ApiProperty({ example: 'TaskD2026' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Le mot de passe doit contenir au moins une lettre et un chiffre',
  })
  password!: string;

  @ApiProperty({ enum: ['delegator', 'collaborator'], example: 'collaborator' })
  @IsIn(['delegator', 'collaborator'])
  role!: 'delegator' | 'collaborator';

  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true, { message: "Vous devez accepter les Conditions Générales d'Utilisation" })
  acceptTerms!: boolean;
}
