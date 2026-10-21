// Enveloppe les gestionnaires asynchrones pour que toute promesse rejetée soit
// transmise au gestionnaire d'erreurs central, et non laissée non capturée.
// Pratique : P20. Évite les rejets de promesse non gérés (ASVS 16.5.4).

import type { Request, Response, NextFunction, RequestHandler } from 'express';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
