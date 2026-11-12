// Pour transformer proprement nos erreurs métier en réponses HTTP standardisées (RFC 9457)

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
