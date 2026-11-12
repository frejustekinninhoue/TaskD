// Les erreurs métier levées par le service  -- traduites automatiquement par DomainErrorFilter

import { DomainError } from '../common/domain.error.js';

export class EmailAlreadyExistsError extends DomainError {
  constructor() {
    super('EMAIL_ALREADY_EXISTS', 'Cet email est déjà associé à un compte.');
  }
}

export class PhoneAlreadyExistsError extends DomainError {
  constructor() {
    super('PHONE_ALREADY_EXISTS', 'Ce numéro de téléphone est déjà utilisé.');
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Identifiants incorrects.');
  }
}

export class AccountLockedError extends DomainError {
  constructor() {
    super('ACCOUNT_LOCKED', 'Compte temporairement bloqué suite à 5 tentatives échouées. Réessayez dans 15 minutes.');
  }
}

export class AccountSuspendedError extends DomainError {
  constructor() {
    super('ACCOUNT_SUSPENDED', 'Ce compte a été suspendu par un administrateur.');
  }
}
