// Utilitaires de date. Toutes les dates manipulées côté serveur sont en UTC
// (ASVS 16.2.2).

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
