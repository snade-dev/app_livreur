import * as SecureStore from 'expo-secure-store';
import type { ProfilLivreur } from './types';

/**
 * Stockage de la session livreur : access token (24 h, sans refresh) + profil,
 * en mémoire pour les requêtes et dans le trousseau chiffré du téléphone pour
 * survivre aux redémarrages. Ce module est la seule source de vérité de la
 * session ; le provider d'auth s'abonne à ses changements.
 */

const CLE_ACCESS = 'aio.livreur.accessToken';
const CLE_PROFIL = 'aio.livreur.profil';

export interface SessionTokens {
  accessToken: string;
  profil: ProfilLivreur;
}

let session: SessionTokens | null = null;

type SessionListener = (session: SessionTokens | null) => void;
const listeners = new Set<SessionListener>();

function notifier(): void {
  for (const listener of listeners) listener(session);
}

/** S'abonner aux changements de session (connexion, déconnexion, expiration). */
export function onSessionChange(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Session courante (mémoire) — null si déconnecté ou pas encore chargée. */
export function getTokens(): SessionTokens | null {
  return session;
}

/** Recharge la session depuis le trousseau au lancement de l'app. */
export async function chargerSession(): Promise<SessionTokens | null> {
  try {
    const [accessToken, profilJson] = await Promise.all([
      SecureStore.getItemAsync(CLE_ACCESS),
      SecureStore.getItemAsync(CLE_PROFIL),
    ]);
    session =
      accessToken && profilJson
        ? { accessToken, profil: JSON.parse(profilJson) as ProfilLivreur }
        : null;
  } catch {
    // Trousseau illisible (rare) : on repart déconnecté, sans crash.
    session = null;
  }
  return session;
}

/** Enregistre la session après connexion. */
export async function setTokens(nouvelle: SessionTokens): Promise<void> {
  session = nouvelle;
  notifier();
  await Promise.all([
    SecureStore.setItemAsync(CLE_ACCESS, nouvelle.accessToken),
    SecureStore.setItemAsync(CLE_PROFIL, JSON.stringify(nouvelle.profil)),
  ]);
}

/** Efface la session (déconnexion volontaire ou token expiré). */
export async function clearTokens(): Promise<void> {
  session = null;
  notifier();
  await Promise.all([
    SecureStore.deleteItemAsync(CLE_ACCESS),
    SecureStore.deleteItemAsync(CLE_PROFIL),
  ]);
}
