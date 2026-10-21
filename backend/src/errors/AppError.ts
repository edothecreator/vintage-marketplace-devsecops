// Hiérarchie d'erreurs applicatives.
// Pratique : P20 Secure coding. Gestion des erreurs (ASVS 16.5).
//
// Principe : une erreur porte un code HTTP et un message GENERIQUE destiné au
// client. Le détail technique (trace, requête) reste dans les journaux et
// n'est jamais renvoyé au client (ASVS 16.5.1), afin de ne pas divulguer la
// structure interne (menace T51).

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly publicMessage: string;
  public readonly code: string;

  constructor(statusCode: number, code: string, publicMessage: string) {
    super(publicMessage);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.publicMessage = publicMessage;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 — entrée invalide (ASVS 2.2.x)
export class ValidationError extends AppError {
  public readonly details: unknown;
  constructor(publicMessage = 'Requête invalide.', details?: unknown) {
    super(400, 'VALIDATION_ERROR', publicMessage);
    this.details = details;
  }
}

// 401 — non authentifié
export class UnauthorizedError extends AppError {
  constructor(publicMessage = 'Authentification requise.') {
    super(401, 'UNAUTHORIZED', publicMessage);
  }
}

// 403 — authentifié mais non autorisé (ASVS 8.2.x) — IDOR/BOLA
export class ForbiddenError extends AppError {
  constructor(publicMessage = 'Accès refusé.') {
    super(403, 'FORBIDDEN', publicMessage);
  }
}

// 404 — ressource absente. Message volontairement identique à 403 dans les
// cas sensibles pour ne pas révéler l'existence d'une ressource d'autrui.
export class NotFoundError extends AppError {
  constructor(publicMessage = 'Ressource introuvable.') {
    super(404, 'NOT_FOUND', publicMessage);
  }
}

// 409 — conflit d'état métier (ex. article déjà vendu, T28/T31)
export class ConflictError extends AppError {
  constructor(publicMessage = 'Conflit avec l’état actuel de la ressource.') {
    super(409, 'CONFLICT', publicMessage);
  }
}

// 413 — charge trop volumineuse (téléversement, T23)
export class PayloadTooLargeError extends AppError {
  constructor(publicMessage = 'Contenu trop volumineux.') {
    super(413, 'PAYLOAD_TOO_LARGE', publicMessage);
  }
}

// 429 — trop de requêtes (anti-automatisation, ASVS 2.4.1)
export class TooManyRequestsError extends AppError {
  constructor(publicMessage = 'Trop de requêtes. Réessayez plus tard.') {
    super(429, 'TOO_MANY_REQUESTS', publicMessage);
  }
}
