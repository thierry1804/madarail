/** Formate un montant en Ariary selon la convention française */
export function formatAriary(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' Ar';
}
