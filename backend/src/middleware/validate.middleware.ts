// Intergiciel de validation.
// Pratique : P20. ASVS 2.2.2 (validation en couche de service de confiance).
//
// La validation s'effectue côté serveur. Toute validation côté client est de
// confort et n'est jamais considérée comme un contrôle de sécurité.

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Lit la partie indiquée de la requête sans indexation dynamique.
 * On évite `req[source]` (déclencherait security/detect-object-injection) en
 * répartissant explicitement sur l'union fermée Source.
 */
function readSource(req: Request, source: Source): unknown {
  if (source === 'body') return req.body;
  if (source === 'query') return req.query;
  return req.params;
}

/**
 * Valide la partie indiquée de la requête contre un schéma Zod.
 * En cas d'échec, l'erreur Zod est transmise au gestionnaire central qui la
 * convertit en réponse 400 structurée. La donnée validée (et nettoyée des
 * champs inconnus par .strict()) remplace la donnée brute.
 */
/**
 * Lit un paramètre de route dont la présence a déjà été garantie par un schéma
 * Zod (via validate(..., 'params')). Évite l'assertion non-null répétée dans
 * les handlers tout en restant honnête : si le paramètre manque malgré tout
 * (handler mal câblé), on lève une erreur explicite plutôt que de propager
 * un undefined silencieux.
 */
export function requireParam(req: Request, name: string): string {
  // `name` est toujours un littéral de notre propre code (ex. 'id'), jamais une
  // entrée client : pas de risque d'injection d'objet ici.
  // eslint-disable-next-line security/detect-object-injection
  const value = req.params[name];
  if (typeof value !== 'string') {
    throw new Error(`Paramètre de route manquant: ${name}`);
  }
  return value;
}

export function validate(schema: ZodTypeAny, source: Source = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(readSource(req, source));
    if (!result.success) {
      next(result.error);
      return;
    }
    // Remplace par la version validée. Pour query/params, on affecte en place
    // car ces objets sont en lecture seule selon les types Express récents.
    const data = result.data as Record<string, unknown>;
    if (source === 'body') {
      req.body = data;
    } else if (source === 'query') {
      Object.assign(req.query, data);
    } else {
      Object.assign(req.params, data);
    }
    next();
  };
}
