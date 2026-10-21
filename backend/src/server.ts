// Point d'entrée du serveur — écoute réseau et arrêt propre.
// Pratique : P20. Démarrage fail-fast (la config est validée dans env.ts,
// importé transitivement) et arrêt gracieux (fermeture des connexions base).

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { disconnectPrisma } from './config/prisma.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API démarrée');
});

// Arrêt gracieux : on cesse d'accepter des connexions, puis on ferme la base.
function shutdown(signal: string): void {
  logger.info({ signal }, 'arrêt en cours');
  server.close(() => {
    void disconnectPrisma().finally(() => {
      logger.info('arrêt terminé');
      process.exit(0);
    });
  });
  // Filet de sécurité : forcer la sortie si la fermeture traîne.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
