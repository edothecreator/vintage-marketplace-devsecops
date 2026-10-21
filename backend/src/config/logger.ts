// Journalisation structurée.
// Pratiques : P18 Logging, P5 Continuous monitoring (préparation).
//
// Décisions clés (ADR 0006, ASVS chapitre V16) :
//   - format JSON structuré, lisible par machine (ASVS 16.2.4)
//   - horodatage UTC (ASVS 16.2.2)
//   - REDACTION des champs sensibles : jamais de mot de passe, de jeton ni de
//     clé dans les journaux (ASVS 16.2.5, données N3)

import { pino } from 'pino';
import { env, isProduction, isTest } from './env.js';

export const logger = pino({
  level: isTest ? 'silent' : isProduction ? 'info' : 'debug',
  timestamp: pino.stdTimeFunctions.isoTime, // UTC ISO-8601

  // Liste d'expurgation. Ces chemins sont remplacés par "[Redacted]" dans
  // toute entrée de journal, quelle que soit leur profondeur.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'accessToken',
      'jwtSecret',
      'apiKey',
      '*.password',
      '*.token',
    ],
    censor: '[Redacted]',
  },

  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Journal d'événements de sécurité (ASVS 16.3.x).
// Un canal dédié rend les événements de sécurité filtrables par les outils
// d'analyse (SIEM), distincts des journaux applicatifs ordinaires.
export const securityLogger = logger.child({ channel: 'security' });

export type SecurityEvent =
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.token.refresh'
  | 'auth.token.reuse_detected'
  | 'authz.denied'
  | 'validation.rejected'
  | 'ratelimit.triggered'
  | 'upload.rejected'
  | 'order.state_change'
  | 'moderation.action'
  | 'error.unexpected';

interface SecurityLogFields {
  userId?: string | undefined;
  ip?: string | undefined;
  resource?: string | undefined;
  action?: string | undefined;
  reason?: string | undefined;
  [key: string]: unknown;
}

export function logSecurityEvent(event: SecurityEvent, fields: SecurityLogFields = {}): void {
  securityLogger.info({ event, ...fields }, event);
}
