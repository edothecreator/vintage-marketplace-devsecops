// Liste de mots de passe courants à refuser (ASVS 6.2.4).
//
// NOTE : l'ASVS 6.2.4 demande la vérification contre au moins 3 000 mots de
// passe courants. Cet extrait embarqué couvre les plus fréquents pour le
// développement et les tests. En phase de durcissement, remplacer par un
// corpus complet (ex. le top 10 000 de SecLists) chargé au démarrage, ou par
// une vérification en ligne de type "have i been pwned" avec k-anonymat
// (ASVS 6.2.12). Décision consignée dans ADR 0006.

export const COMMON_PASSWORDS = new Set<string>([
  'password',
  'password1',
  'password123',
  '123456',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'qwertyuiop',
  'azerty',
  'azertyuiop',
  'abc123',
  'letmein',
  'welcome',
  'welcome1',
  'admin',
  'admin123',
  'root',
  'toor',
  'iloveyou',
  'monkey',
  'dragon',
  'sunshine',
  'princess',
  'football',
  'baseball',
  'master',
  'superman',
  'batman',
  'trustno1',
  'passw0rd',
  'p@ssword',
  'p@ssw0rd',
  'changeme',
  'secret',
  'login',
  'test1234',
  'motdepasse',
  'soleil',
  'bonjour',
  '00000000',
  '11111111',
  'aaaaaaaa',
  'qwerty123',
  'hello123',
]);
