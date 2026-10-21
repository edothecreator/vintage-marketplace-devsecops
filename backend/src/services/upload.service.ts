// Service de téléversement d'images — surface d'attaque critique.
// Pratique : P20. ASVS V5 (validation de fichier), V14 (manipulation de fichiers).
// Menaces couvertes : T20 (fichier malveillant déguisé en image), T21 (RCE via
// contenu), T22 (traversée de chemin), T23 (bombe de décompression / DoS),
// T24 (métadonnées EXIF sensibles), T25 (XSS stocké via SVG/HTML), T26 (upload
// sur annonce d'autrui), T27 (stockage sous nom fourni par l'utilisateur).
//
// Défense en profondeur :
//   1. Type MIME déclaré sur liste d'autorisation (jpeg/png/webp uniquement).
//   2. Vérification des OCTETS MAGIQUES — on ne fait jamais confiance au
//      Content-Type ni à l'extension (ASVS 14.1.x).
//   3. RÉ-ENCODAGE via sharp : l'image est entièrement redessinée. Tout contenu
//      non-pixel (script, polyglotte, EXIF, chunk ICC malveillant) est éliminé.
//      C'est la défense la plus forte contre T20/T21/T24/T25.
//   4. Limite de dimensions + limite d'octets AVANT décodage (anti-DoS, T23).
//   5. Nom de stockage = UUID généré en interne, jamais le nom fourni (T22/T27).
//   6. SVG explicitement REFUSÉ (vecteur XSS stocké, T25).

import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { logSecurityEvent } from '../config/logger.js';
import { ValidationError, PayloadTooLargeError } from '../errors/AppError.js';
import { getOwnedListing } from './listing.service.js';

// Formats acceptés et leur signature d'octets magiques. On ré-encode toujours
// en WebP en sortie pour normaliser le stockage.
const ALLOWED_INPUT_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Bornes de sécurité (anti-DoS, T23). Un attaquant ne peut pas forcer sharp à
// décoder une image de dimensions démesurées.
const MAX_DIMENSION = 4096; // px
const OUTPUT_FORMAT = 'webp';

interface StoredImageResult {
  id: string;
  storedFilename: string;
  mimeType: string;
}

/**
 * Vérifie les octets magiques du tampon. Retourne le type réel détecté, ou
 * null si la signature ne correspond à aucun format autorisé.
 * On ne se fie JAMAIS au Content-Type annoncé (menace T20).
 */
function sniffImageType(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buf.length < 12) return null;

  // JPEG : FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  // WebP : "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

/**
 * Valide, ré-encode et stocke une image pour une annonce.
 * @param listingId annonce cible
 * @param sellerId  utilisateur authentifié (issu du jeton) — DOIT être le
 *                  propriétaire de l'annonce (menace T26)
 * @param declaredMime Content-Type annoncé par le client (indicatif seulement)
 * @param body      octets bruts de la requête
 * @param ip        pour la journalisation de sécurité
 */
export async function storeListingImage(params: {
  listingId: string;
  sellerId: string;
  declaredMime: string | undefined;
  body: Buffer;
  ip: string | undefined;
}): Promise<StoredImageResult> {
  const { listingId, sellerId, declaredMime, body, ip } = params;

  // 1. Autorisation au niveau donnée : seul le propriétaire de l'annonce peut
  //    y attacher une image (menace T26). Résolu en base, jamais par le corps.
  await getOwnedListing(listingId, sellerId);

  // 2. Limite de taille (défense en profondeur ; express.raw l'applique déjà).
  if (body.length === 0) {
    throw new ValidationError('Fichier vide.');
  }
  if (body.length > env.MAX_UPLOAD_BYTES) {
    logSecurityEvent('upload.rejected', {
      userId: sellerId,
      ip,
      resource: `listing:${listingId}`,
      reason: 'taille dépassée',
    });
    throw new PayloadTooLargeError();
  }

  // 3. Octets magiques. On REFUSE tout ce qui n'est pas une image reconnue,
  //    indépendamment du Content-Type annoncé (menaces T20, T25 — un SVG ou un
  //    HTML n'a aucune signature binaire d'image et est donc rejeté ici).
  const sniffed = sniffImageType(body);
  if (!sniffed || !ALLOWED_INPUT_MIME.has(sniffed)) {
    logSecurityEvent('upload.rejected', {
      userId: sellerId,
      ip,
      resource: `listing:${listingId}`,
      reason: `signature non autorisée (déclaré: ${declaredMime ?? 'néant'})`,
    });
    throw new ValidationError('Type de fichier non autorisé. Images JPEG, PNG ou WebP uniquement.');
  }

  // 4. RÉ-ENCODAGE. sharp redessine l'image pixel par pixel et n'émet que des
  //    données d'image valides : tout payload, script ou métadonnée est perdu
  //    (menaces T21, T24). failOn: 'error' rejette une image corrompue/piégée.
  let reencoded: Buffer;
  try {
    reencoded = await sharp(body, {
      failOn: 'error',
      limitInputPixels: MAX_DIMENSION * MAX_DIMENSION,
    })
      .rotate() // applique l'orientation EXIF puis la supprime
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .toFormat(OUTPUT_FORMAT, { quality: 82 })
      .toBuffer();
  } catch {
    logSecurityEvent('upload.rejected', {
      userId: sellerId,
      ip,
      resource: `listing:${listingId}`,
      reason: 'échec du ré-encodage (image invalide ou piégée)',
    });
    throw new ValidationError('Image invalide.');
  }

  // 5. Nom de stockage interne = UUID (menaces T22, T27). Le nom fourni par le
  //    client n'intervient jamais dans le chemin. On résout le chemin absolu et
  //    on vérifie qu'il reste bien sous le répertoire de stockage (anti-T22).
  const storedFilename = `${randomUUID()}.webp`;
  const uploadDir = path.resolve(env.UPLOAD_DIR);
  const destPath = path.resolve(uploadDir, storedFilename);
  if (path.dirname(destPath) !== uploadDir) {
    // Ne devrait jamais arriver (UUID sans séparateur), garde-fou explicite.
    throw new ValidationError('Chemin de stockage invalide.');
  }

  // Chemins NON dérivés d'une entrée client : uploadDir vient de la config et
  // destPath = uploadDir + UUID.webp, déjà vérifié comme restant sous uploadDir
  // (garde-fou anti-traversée ci-dessus). L'alerte du linter est un faux positif
  // documenté ici.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await mkdir(uploadDir, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(destPath, reencoded);

  const image = await prisma.listingImage.create({
    data: {
      listingId,
      storedFilename,
      mimeType: `image/${OUTPUT_FORMAT}`,
    },
  });

  logSecurityEvent('order.state_change', {
    userId: sellerId,
    resource: `listing:${listingId}`,
    action: 'image.stored',
    reason: `${sniffed} -> ${OUTPUT_FORMAT}`,
  });

  return {
    id: image.id,
    storedFilename: image.storedFilename,
    mimeType: image.mimeType,
  };
}
