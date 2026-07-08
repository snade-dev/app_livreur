import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Remplace le libellé par un indicateur d'activité (mutation en cours). */
  loading?: boolean;
  /** Variante destructive (déconnexion, vider le panier…). */
  tone?: 'primary' | 'danger';
}

/** Bouton plein pleine largeur — l'action principale d'un écran. */
export function PrimaryButton({ label, onPress, disabled, loading, tone = 'primary' }: Props) {
  const inactif = disabled === true || loading === true;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactif}
      style={({ pressed }) => [
        styles.button,
        tone === 'danger' && styles.danger,
        pressed && !inactif && (tone === 'danger' ? styles.dangerPressed : styles.pressed),
        inactif && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <Text style={typography.button}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  danger: {
    backgroundColor: colors.danger,
  },
  dangerPressed: {
    backgroundColor: colors.dangerPressed,
  },
  disabled: {
    opacity: 0.45,
  },
});
