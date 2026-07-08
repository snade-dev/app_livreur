import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

interface Props {
  /** Accroche en gras rouge (« Échec de l'envoi. »). */
  titre: string;
  message: string;
}

/** Encart d'erreur doux (maquette 4j) : fond rosé, ⚠️, accroche + explication. */
export function ErrorBanner({ titre, message }: Props) {
  return (
    <View style={styles.banniere}>
      <Text style={styles.icone}>⚠️</Text>
      <Text style={styles.texte}>
        <Text style={styles.accroche}>{titre} </Text>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banniere: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  icone: {
    fontSize: 16,
  },
  texte: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
  },
  accroche: {
    fontFamily: fonts.bold,
    color: colors.danger,
  },
});
