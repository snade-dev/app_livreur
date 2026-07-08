import { ApiError, postJson } from './client';
import type { SessionLivreur } from './types';

/**
 * Connexion staff (le livreur est un employé) : email + mot de passe sur
 * `/auth/login-staff`. La réponse porte les permissions du rôle — l'app
 * refuse la connexion si `EFFECTUER_LIVRAISONS` est absente (mauvais compte,
 * pas un livreur).
 */
export async function loginLivreur(
  email: string,
  motDePasse: string,
): Promise<SessionLivreur> {
  const data = await postJson<SessionLivreur>('/auth/login-staff', {
    email,
    motDePasse,
  });
  if (!data.user.permissions?.includes('EFFECTUER_LIVRAISONS')) {
    throw new ApiError(
      "Ce compte n'est pas un compte livreur. Demande au gérant de t'attribuer le rôle Livreur.",
      403,
      'NOT_A_COURIER',
    );
  }
  return data;
}
