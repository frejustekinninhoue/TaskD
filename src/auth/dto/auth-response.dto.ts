// Règle de sécurité : on ne renvoie jamais passwordHash au client !

import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty() id!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() phone!: string;
  @ApiProperty() profession!: string;
  @ApiProperty({ isArray: true, example: ['collaborator'] }) roles!: string[];
  @ApiProperty() createdAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ type: UserProfileDto }) user!: UserProfileDto;
}
