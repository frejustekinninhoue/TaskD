// Définit les types métier de l'utilisateur -- sans code HTTP

export type UserRole = 'delegator' | 'collaborator' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  lastName: string;
  firstName: string;
  username: string | null;
  email: string;
  phone: string;
  profession: string;
  passwordHash: string;
  roles: UserRole[];
  status: UserStatus;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  lastName: string;
  firstName: string;
  username?: string;
  email: string;
  phone: string;
  profession: string;
  passwordHash: string;
  role: UserRole;
}
