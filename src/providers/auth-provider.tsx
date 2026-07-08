import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  chargerSession,
  clearTokens,
  getTokens,
  onSessionChange,
  setTokens,
} from '@/api/session';
import type { ProfilLivreur, SessionLivreur } from '@/api/types';

/**
 * État de session de l'app livreur : `chargement` le temps de relire le
 * trousseau au lancement, puis `connecte` / `deconnecte`. La source de vérité
 * est `src/api/session.ts` ; une expiration détectée en plein appel réseau
 * déconnecte proprement (les écrans basculent d'eux-mêmes vers le login).
 */

type AuthStatut = 'chargement' | 'connecte' | 'deconnecte';

interface AuthContextValue {
  statut: AuthStatut;
  profil: ProfilLivreur | null;
  ouvrirSession: (session: SessionLivreur) => Promise<void>;
  fermerSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [statut, setStatut] = useState<AuthStatut>('chargement');
  const [profil, setProfil] = useState<ProfilLivreur | null>(null);

  useEffect(() => {
    let actif = true;
    void chargerSession().then((session) => {
      if (!actif) return;
      setProfil(session?.profil ?? null);
      setStatut(session ? 'connecte' : 'deconnecte');
    });
    const desabonner = onSessionChange((session) => {
      setProfil(session?.profil ?? null);
      setStatut(session ? 'connecte' : 'deconnecte');
      // Session close : on oublie toutes les données privées en cache.
      if (!session) queryClient.removeQueries({ queryKey: ['livreur'] });
    });
    return () => {
      actif = false;
      desabonner();
    };
  }, [queryClient]);

  const ouvrirSession = useCallback(async (session: SessionLivreur) => {
    await setTokens({ accessToken: session.accessToken, profil: session.user });
  }, []);

  const fermerSession = useCallback(async () => {
    await clearTokens();
  }, []);

  const value = useMemo(
    () => ({ statut, profil, ouvrirSession, fermerSession }),
    [statut, profil, ouvrirSession, fermerSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexte = useContext(AuthContext);
  if (!contexte) {
    throw new Error('useAuth doit être utilisé sous <AuthProvider>.');
  }
  return contexte;
}

export { getTokens };
