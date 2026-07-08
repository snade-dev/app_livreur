import { useQuery } from '@tanstack/react-query';
import { fetchLivraison, fetchMesLivraisons } from '@/api/livraisons';
import { useAuth } from '@/providers/auth-provider';

/**
 * Ma tournée (actives par défaut : EN_PREPARATION / PRETE / EN_LIVRAISON),
 * pollée toutes les 10 s — les nouvelles assignations arrivent sans manipuler.
 */
export function useMesLivraisons() {
  const { statut } = useAuth();
  return useQuery({
    queryKey: ['livreur', 'mes-livraisons'],
    queryFn: () => fetchMesLivraisons({ limit: 50 }),
    enabled: statut === 'connecte',
    refetchInterval: 10_000,
    placeholderData: (prev) => prev,
  });
}

/** Historique (livrées) — chargé à la demande dans la section repliée. */
export function useMesLivraisonsLivrees(actif: boolean) {
  const { statut } = useAuth();
  return useQuery({
    queryKey: ['livreur', 'mes-livraisons', 'livrees'],
    queryFn: () => fetchMesLivraisons({ statut: 'LIVREE', limit: 30 }),
    enabled: statut === 'connecte' && actif,
  });
}

/** Détail d'une course, rafraîchi tant qu'elle est active. */
export function useLivraison(id: string) {
  const { statut } = useAuth();
  return useQuery({
    queryKey: ['livreur', 'livraison', id],
    queryFn: () => fetchLivraison(id),
    enabled: statut === 'connecte' && id.length > 0,
    refetchInterval: (query) => {
      const statutLivraison = query.state.data?.statutLivraison;
      return statutLivraison === 'LIVREE' ||
        statutLivraison === 'REFUSEE' ||
        statutLivraison === 'ANNULEE'
        ? false
        : 10_000;
    },
  });
}
