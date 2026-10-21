// Service de mots de passe.
// Pratiques : P20 Secure coding. ASVS chapitre V6 et V11.
//
// Décisions (ADR 0006) :
//   - hachage Argon2id, fonction de dérivation approuvée (ASVS 11.4.2, RFC 9106)
//   - longueur 8..128 (ASVS 6.2.1), aucune règle de composition (ASVS 6.2.5)
//   - vérification contre une liste de mots de passe courants (ASVS 6.2.4)
//   - liste de mots interdits spécifiques au contexte (ASVS 6.1.2)
//   - le mot de passe est vérifié tel quel, sans troncature (ASVS 6.2.8)

import argon2 from 'argon2';
import { ValidationError } from '../errors/AppError.js';
import { COMMON_PASSWORDS } from '../data/common-passwords.js';

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

// Mots interdits propres au contexte (ASVS 6.1.2, menace T08).
const CONTEXT_FORBIDDEN = [
  'vintage',
  'marketplace',
  'elkhanfaf',
  'irisi',
  'devsecops',
];

// Paramètres Argon2id. argon2id est le variant recommandé ; les paramètres
// par défaut de la bibliothèque respectent RFC 9106. On fixe explicitement un
// coût mémoire conforme aux recommandations (>= 19 MiB pour t=2).
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

/**
 * Valide la politique de mot de passe (ASVS 6.2.x).
 * Lève une ValidationError avec un message générique en cas d'échec.
 */
export function validatePasswordPolicy(password: string): void {
  if (password.length < MIN_LENGTH || password.length > MAX_LENGTH) {
    throw new ValidationError(
      `Le mot de passe doit comporter entre ${MIN_LENGTH} et ${MAX_LENGTH} caractères.`,
    );
  }

  const lower = password.toLowerCase();

  // Liste de mots de passe courants / fuités (ASVS 6.2.4, 6.2.12).
  if (COMMON_PASSWORDS.has(lower)) {
    throw new ValidationError('Ce mot de passe est trop courant. Choisissez-en un autre.');
  }

  // Mots interdits spécifiques au contexte (ASVS 6.1.2).
  for (const word of CONTEXT_FORBIDDEN) {
    if (lower.includes(word)) {
      throw new ValidationError('Ce mot de passe est trop prévisible. Choisissez-en un autre.');
    }
  }
}

/** Hache un mot de passe avec Argon2id (ASVS 11.4.2). */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Vérifie un mot de passe contre son empreinte.
 * argon2.verify est à temps constant, ce qui limite les fuites par canal
 * temporel (ASVS 11.2.4).
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    // Une empreinte malformée ne doit pas authentifier.
    return false;
  }
}
