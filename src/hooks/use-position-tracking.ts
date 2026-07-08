import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { envoyerPosition } from '@/api/livraisons';

/**
 * Suivi de position pendant une course : tant que `actif` est vrai et que
 * l'app est au premier plan, la position est observée (~10 s / 20 m) et
 * envoyée au serveur, où client et commerçant la lisent en polling.
 *
 * ⚠️ Tracking en ARRIÈRE-PLAN hors MVP : il exige un dev build +
 * expo-task-manager (impossible dans Expo Go). L'écran doit rester allumé
 * pendant la course — voir README.
 */
export function usePositionTracking(actif: boolean): {
  autorise: boolean | null;
  derniereEmission: Date | null;
} {
  const [autorise, setAutorise] = useState<boolean | null>(null);
  const [derniereEmission, setDerniereEmission] = useState<Date | null>(null);
  const dernierEnvoiRef = useRef(0);

  useEffect(() => {
    if (!actif) return;
    let souscription: Location.LocationSubscription | null = null;
    let annule = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (annule) return;
      const ok = status === Location.PermissionStatus.GRANTED;
      setAutorise(ok);
      if (!ok) return;

      souscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10_000,
          distanceInterval: 20,
        },
        (position) => {
          // Garde-fou : jamais plus d'un envoi toutes les 10 s (throttler API).
          const maintenant = Date.now();
          if (maintenant - dernierEnvoiRef.current < 10_000) return;
          dernierEnvoiRef.current = maintenant;
          envoyerPosition(position.coords.latitude, position.coords.longitude)
            .then(() => setDerniereEmission(new Date()))
            .catch(() => {
              // Réseau capricieux : on retentera au tick suivant.
            });
        },
      );
    })();

    return () => {
      annule = true;
      souscription?.remove();
    };
  }, [actif]);

  return { autorise, derniereEmission };
}
