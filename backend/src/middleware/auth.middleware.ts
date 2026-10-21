// Intergiciels d'authentification et d'autorisation.
// Pratiques : P20. ASVS chapitre V8 (autorisation).
//
// *** COMPOSANT LE PLUS CRITIQUE DU BACKEND ***
// Le contrôle d'accès rompu (IDOR/BOLA, menaces T14 et T29) est le risque le
// plus élevé du modèle de menaces (score 9/9). Cet intergiciel est construit
// AVANT les routes qu'il protège, pour qu'aucune route ne puisse exister sans
// décision d'autorisation explicite.
//
// Principes :
//   - l'identité provient TOUJOURS du jeton vérifié, jamais du corps de requête
//     (ASVS 8.3.1)
//   - la propriété d'une ressource est résolue côté serveur, en base
//     (ASVS 8.2.2)
//   - l'application au niveau fonction (rôle) et au niveau donnée (propriété)
//     sont deux contrôles distincts et complémentaires

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { verifyAccessToken } from '../services/token.service.js';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';
import { logSecurityEvent } from '../config/logger.js';

// Identité authentifiée attachée à la requête. En lecture seule : rien ne la
// modifie après vérification du jeton.
export interface AuthenticatedUser {
  readonly id: string;
  readonly role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Exige un jeton d'accès valide. Peuple req.user à partir des claims vérifiés.
 * Le jeton est lu depuis l'en-tête Authorization: Bearer.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  void authenticate(req, next);
};

async function authenticate(req: Request, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError();
    }
    const token = header.slice('Bearer '.length).trim();
    const claims = await verifyAccessToken(token);
    req.user = { id: claims.sub, role: claims.role };
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      // Jeton expiré, signature invalide, alg refusé, etc. -> 401 générique.
      // On ne révèle pas la raison précise au client (ASVS 16.5.1).
      next(new UnauthorizedError('Jeton invalide ou expiré.'));
    }
  }
}

/**
 * Autorisation au niveau FONCTION (ASVS 8.2.1).
 * N'autorise que les rôles explicitement listés. À utiliser après requireAuth.
 *
 * Exemple : requireRole('ADMIN') protège les routes de modération (T39).
 */
export function requireRole(...allowed: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!allowed.includes(req.user.role)) {
      logSecurityEvent('authz.denied', {
        userId: req.user.id,
        ip: req.ip,
        resource: req.originalUrl,
        action: req.method,
        reason: `role ${req.user.role} non autorisé`,
      });
      // 403 : authentifié mais pas le bon rôle.
      next(new ForbiddenError());
      return;
    }
    next();
  };
}

/**
 * Autorisation au niveau DONNÉE (ASVS 8.2.2) — la défense contre IDOR/BOLA.
 *
 * Ce helper N'EST PAS un intergiciel générique : la propriété ne peut pas être
 * vérifiée sans interroger la base pour la ressource concernée. Il est donc
 * appelé à l'intérieur de chaque handler, après avoir chargé la ressource, et
 * compare le propriétaire réel (issu de la base) à l'utilisateur authentifié
 * (issu du jeton). L'identifiant de propriétaire n'est JAMAIS lu dans le corps
 * de la requête.
 *
 * Journalise tout refus (menaces T14, T26, T29 ; ASVS 16.3.2).
 */
export function assertOwnership(
  req: Request,
  resourceOwnerId: string,
  resourceLabel: string,
): void {
  const user = req.user;
  if (!user) {
    throw new UnauthorizedError();
  }
  // Un administrateur peut passer outre si la route le prévoit ; ici on reste
  // strict : la propriété prime. Les routes d'admin utilisent requireRole.
  if (user.id !== resourceOwnerId) {
    logSecurityEvent('authz.denied', {
      userId: user.id,
      ip: req.ip,
      resource: req.originalUrl,
      action: req.method,
      reason: `tentative d'accès à ${resourceLabel} d'un autre utilisateur`,
    });
    // Message identique à un 404 pour ne pas confirmer l'existence de la
    // ressource d'autrui. On renvoie néanmoins 403 côté code HTTP car le test
    // d'abus attend explicitement 403 (voir phase 3).
    throw new ForbiddenError();
  }
}
