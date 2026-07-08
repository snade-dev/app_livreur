/** Montant en FCFA, arrondi, séparateurs français. */
export function formatFCFA(montant: number): string {
  return `${Math.round(montant).toLocaleString('fr-FR')} FCFA`;
}
