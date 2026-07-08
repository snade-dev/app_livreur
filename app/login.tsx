import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginLivreur } from '@/api/auth';
import { ErrorBanner } from '@/components/error-banner';
import { PrimaryButton } from '@/components/primary-button';
import { useAuth } from '@/providers/auth-provider';
import { colors, fonts, radius, spacing, typography } from '@/theme/tokens';

/**
 * Connexion livreur : email + mot de passe du compte employé (créé par le
 * gérant dans le Hub avec le rôle Livreur). Refuse les comptes sans la
 * permission EFFECTUER_LIVRAISONS.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { ouvrirSession } = useAuth();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);

  const connexion = useMutation({
    mutationFn: () => loginLivreur(email.trim(), motDePasse),
    onSuccess: async (session) => {
      await ouvrirSession(session);
      router.replace('/');
    },
  });

  const pret = email.trim().length > 0 && motDePasse.length >= 8;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>🛵</Text>
          <Text style={styles.titre}>All-in-One Livreur</Text>
          <Text style={styles.sousTitre}>
            Connecte-toi avec ton compte employé pour voir ta tournée.
          </Text>

          <View style={styles.formulaire}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="livreur@exemple.com"
              placeholderTextColor={colors.inkFaint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.champ}
            />
            <Text style={[styles.label, styles.labelEspace]}>Mot de passe</Text>
            <View style={styles.champMotDePasse}>
              <TextInput
                value={motDePasse}
                onChangeText={setMotDePasse}
                placeholder="••••••••"
                placeholderTextColor={colors.inkFaint}
                secureTextEntry={!motDePasseVisible}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                style={styles.champMotDePasseSaisie}
                onSubmitEditing={() => pret && connexion.mutate()}
              />
              <Pressable
                onPress={() => setMotDePasseVisible((v) => !v)}
                hitSlop={8}
                style={styles.oeil}
              >
                <Text style={styles.oeilIcone}>
                  {motDePasseVisible ? '🙈' : '👁️'}
                </Text>
              </Pressable>
            </View>
          </View>

          {connexion.isError ? (
            <ErrorBanner titre="Connexion impossible." message={connexion.error.message} />
          ) : null}

          <PrimaryButton
            label="Se connecter"
            onPress={() => connexion.mutate()}
            disabled={!pret}
            loading={connexion.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenu: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  logo: {
    fontSize: 48,
    textAlign: 'center',
  },
  titre: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.ink,
    textAlign: 'center',
  },
  sousTitre: {
    ...typography.caption,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  formulaire: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.inkMuted,
    marginBottom: spacing.xs,
  },
  labelEspace: {
    marginTop: spacing.md,
  },
  champ: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  champMotDePasse: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  champMotDePasseSaisie: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  oeil: {
    paddingHorizontal: spacing.md,
  },
  oeilIcone: {
    fontSize: 18,
  },
});
