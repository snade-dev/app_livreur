import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadows, spacing } from '@/theme/tokens';

/**
 * Toast maison (aucune dépendance) : confirmation furtive d'une action —
 * « Ajouté au panier », « Commande annulée »… Glisse depuis le bas, au-dessus
 * de la barre d'onglets, et disparaît seul.
 */

const DUREE_AFFICHAGE_MS = 2200;

interface ToastContextValue {
  montrer: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacite = useRef(new Animated.Value(0)).current;
  const translation = useRef(new Animated.Value(16)).current;
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  const masquer = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacite, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translation, { toValue: 16, duration: 180, useNativeDriver: true }),
    ]).start(() => setMessage(null));
  }, [opacite, translation]);

  const montrer = useCallback(
    (texte: string) => {
      if (minuteur.current) clearTimeout(minuteur.current);
      setMessage(texte);
      Animated.parallel([
        Animated.timing(opacite, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(translation, { toValue: 0, useNativeDriver: true, speed: 20 }),
      ]).start();
      minuteur.current = setTimeout(masquer, DUREE_AFFICHAGE_MS);
    },
    [masquer, opacite, translation],
  );

  const value = useMemo(() => ({ montrer }), [montrer]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message !== null ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { bottom: insets.bottom + 74 },
            { opacity: opacite, transform: [{ translateY: translation }] },
          ]}
        >
          <View style={styles.coche}>
            <Text style={styles.cocheTexte}>✓</Text>
          </View>
          <Text style={styles.texte} numberOfLines={2}>
            {message}
          </Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const contexte = useContext(ToastContext);
  if (!contexte) {
    throw new Error('useToast doit être utilisé sous <ToastProvider>.');
  }
  return contexte;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.raised,
  },
  coche: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cocheTexte: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.surface,
  },
  texte: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.surface,
  },
});
