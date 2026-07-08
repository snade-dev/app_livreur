import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';

// ─── Primitive de pulsation partagée par tous les squelettes ────────────────

function usePulse() {
  const pulse = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return pulse;
}

/** Bloc gris pulsant réutilisable. */
export function SkeletonBlock({
  width,
  height,
  radius: r = radius.sm,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  style?: object;
}) {
  const pulse = usePulse();
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: r, backgroundColor: colors.skeleton, opacity: pulse },
        style,
      ]}
    />
  );
}

// ─── Squelette liste établissements (écran Magasins) ────────────────────────

export function EtablissementListSkeleton({ count = 6 }: { count?: number }) {
  const pulse = usePulse();
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }, (_, index) => (
        <Animated.View key={index} style={[styles.skeletonRow, { opacity: pulse }]}>
          <View style={styles.skeletonLogo} />
          <View style={styles.skeletonDetails}>
            <View style={[styles.skeletonLine, { width: '60%' }]} />
            <View style={[styles.skeletonLine, { width: '85%' }]} />
            <View style={[styles.skeletonLine, { width: 88, height: 18, borderRadius: radius.pill }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

// ─── Squelette grille catalogue (2 colonnes) ────────────────────────────────

export function CatalogueGridSkeleton({ count = 6 }: { count?: number }) {
  const pulse = usePulse();
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }, (_, index) => (
        <Animated.View key={index} style={[styles.gridCard, { opacity: pulse }]}>
          <View style={styles.gridThumb} />
          <View style={styles.gridBody}>
            <View style={[styles.skeletonLine, { width: '90%' }]} />
            <View style={[styles.skeletonLine, { width: '50%' }]} />
            <View style={[styles.skeletonLine, { width: 80, height: 18, borderRadius: radius.pill }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

// ─── Squelette page détail ──────────────────────────────────────────────────

export function DetailSkeleton() {
  const pulse = usePulse();
  return (
    <Animated.View style={[styles.detail, { opacity: pulse }]}>
      <View style={styles.detailImage} />
      <View style={[styles.skeletonLine, { width: '70%', height: 22 }]} />
      <View style={[styles.skeletonLine, { width: '40%', height: 18 }]} />
      <View style={[styles.skeletonLine, { width: '100%' }]} />
      <View style={[styles.skeletonLine, { width: '95%' }]} />
      <View style={[styles.skeletonLine, { width: '80%' }]} />
    </Animated.View>
  );
}

// ─── États message (vide, erreur, invite) ───────────────────────────────────

interface ScreenMessageProps {
  title: string;
  message: string;
  tone?: 'neutral' | 'error';
  onRetry?: () => void;
  retryLabel?: string;
  icon?: ReactNode;
}

/** Bloc centré générique : vide, erreur réseau, invite de recherche… */
export function ScreenMessage({
  title,
  message,
  tone = 'neutral',
  onRetry,
  retryLabel = 'Réessayer',
  icon,
}: ScreenMessageProps) {
  return (
    <View style={styles.centered}>
      {tone === 'error' && !icon ? (
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>!</Text>
        </View>
      ) : (
        icon
      )}
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            pressed && { backgroundColor: colors.primaryPressed },
          ]}
        >
          <Text style={typography.button}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Erreur réseau / serveur (conservé pour l'écran Magasins existant). */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <ScreenMessage
      tone="error"
      title="Connexion impossible"
      message={message}
      onRetry={onRetry}
    />
  );
}

/** Liste établissements vide (conservé pour l'écran Magasins existant). */
export function EmptyState() {
  return (
    <ScreenMessage
      title="Aucun établissement"
      message="Aucun magasin ni restaurant n'est disponible pour le moment. Reviens un peu plus tard !"
    />
  );
}

/** Pied de liste : chargement de page suivante ou relance après échec. */
export function ListFooter({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <View style={styles.footer}>
        <SkeletonBlock width={140} height={14} />
      </View>
    );
  }
  if (error) {
    return (
      <Pressable onPress={onRetry} style={styles.footer}>
        <Text style={styles.footerRetry}>Erreur de chargement — appuie pour réessayer</Text>
      </Pressable>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  skeletonList: {
    gap: spacing.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  skeletonLogo: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.skeleton,
  },
  skeletonDetails: {
    flex: 1,
    gap: spacing.sm,
  },
  skeletonLine: {
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.skeleton,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  gridThumb: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.skeleton,
  },
  gridBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  detail: {
    gap: spacing.md,
  },
  detailImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.skeleton,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconText: {
    ...typography.screenTitle,
    fontSize: 24,
    color: colors.danger,
  },
  stateTitle: {
    ...typography.cardTitle,
    fontSize: 18,
    textAlign: 'center',
  },
  stateMessage: {
    ...typography.caption,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  footerRetry: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
});
