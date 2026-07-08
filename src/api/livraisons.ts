import { getJsonAuth, patchJsonAuth, postJsonAuth } from './client';
import type { Livraison, PaginationLivraison, StatutLivraison } from './types';

/**
 * Ma tournée (`/livreur/*`) : commandes qui me sont assignées. Démarrer une
 * course la passe EN_LIVRAISON ; la clôturer exige le code à 4 chiffres que le
 * client affiche dans son app (le serveur décrémente alors le stock et
 * encaisse la vente).
 */

export interface MesLivraisonsResult {
  commandes: Livraison[];
  pagination: PaginationLivraison;
}

export function fetchMesLivraisons(params: {
  statut?: StatutLivraison;
  page?: number;
  limit?: number;
} = {}): Promise<MesLivraisonsResult> {
  return getJsonAuth<MesLivraisonsResult>('/livreur/mes-livraisons', {
    statut: params.statut,
    page: params.page,
    limit: params.limit,
  });
}

export function fetchLivraison(id: string): Promise<Livraison> {
  return getJsonAuth<{ commande: Livraison }>(`/livreur/mes-livraisons/${id}`).then(
    (data) => data.commande,
  );
}

/** PRETE → EN_LIVRAISON : je récupère la commande et je pars. */
export function demarrerLivraison(id: string): Promise<Livraison> {
  return patchJsonAuth<{ commande: Livraison }>(
    `/livreur/mes-livraisons/${id}/demarrer`,
    {},
  ).then((data) => data.commande);
}

/** EN_LIVRAISON → LIVREE : code du client obligatoire (403 si invalide). */
export function livrerLivraison(
  id: string,
  codeConfirmation: string,
): Promise<Livraison> {
  return patchJsonAuth<{ commande: Livraison }>(
    `/livreur/mes-livraisons/${id}/livrer`,
    { codeConfirmation },
  ).then((data) => data.commande);
}

/** Position GPS (~toutes les 10 s pendant une course EN_LIVRAISON). */
export function envoyerPosition(latitude: number, longitude: number): Promise<unknown> {
  return postJsonAuth('/livreur/position', { latitude, longitude });
}
