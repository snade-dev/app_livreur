import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '@/theme/tokens';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Contenu optionnel sous le titre (badges, etc.). */
  children?: ReactNode;
}

/** En-tête d'écran cohérent, avec bouton retour facultatif. */
export function ScreenHeader({ title, subtitle, onBack, children }: Props) {
  return (
    <View style={styles.header}>
      {onBack && (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
      )}
      <View style={styles.titles}>
        <Text style={typography.screenTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={typography.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  backPressed: {
    backgroundColor: colors.skeleton,
  },
  backArrow: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: colors.ink,
    lineHeight: 22,
  },
  titles: {
    flex: 1,
    gap: spacing.xs,
  },
});
