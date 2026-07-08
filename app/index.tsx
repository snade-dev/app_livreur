import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Livraison, StatutLivraison } from '@/api/types';
import { ScreenMessage, SkeletonBlock } from '@/components/screen-states';
import {
  useMesLivraisons,
  useMesLivraisonsLivrees,
} from '@/hooks/use-mes-livraisons';
import { usePositionTracking } from '@/hooks/use-position-tracking';
import { formatFCFA } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import { colors, fonts, radius, shadows, spacing, typography } from '@/theme/tokens';

/**
 * Ma tournée : À récupérer (PRETE) / En préparation / En cours (EN_LIVRAISON) /
 * Historique. Pollée toutes les 10 s. Le suivi GPS est actif dès qu'une course
 * est EN_LIVRAISON (app au premier plan — voir README pour l'arrière-plan).
 */
export default function TourneeScreen() {
  const { statut, profil, fermerSession } = useAuth();
  const router = useRouter();
  const livraisons = useMesLivraisons();
  const [voirHistorique, setVoirHistorique] = useState(false);
  const historique = useMesLivraisonsLivrees(voirHistorique);

  const commandes = livraisons.data?.commandes ?? [];
  const enCours = commandes.filter((c) => c.statutLivraison === 'EN_LIVRAISON');
  const aRecuperer = commandes.filter((c) => c.statutLivraison === 'PRETE');
  const enPreparation = commandes.filter(
    (c) => c.statutLivraison === 'EN_PREPARATION',
  );

  // Émission de la position tant qu'au moins une course roule.
  const tracking = usePositionTracking(enCours.length > 0);

  if (statut === 'deconnecte') return <Redirect href="/login" />;
  if (statut === 'chargement') {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <View style={styles.chargement}>
          <SkeletonBlock width="100%" height={96} />
          <SkeletonBlock width="100%" height={96} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.entete}>
        <View style={styles.enteteTextes}>
          <Text style={typography.screenTitle}>Mes livraisons</Text>
          <Text style={styles.enteteSous}>
            {profil ? `${profil.prenom} ${profil.nom}` : ''}
            {enCours.length > 0
              ? tracking.autorise === false
                ? ' · ⚠️ localisation refusée'
                : tracking.derniereEmission
                  ? ' · 📡 position partagée'
                  : ' · 📡 recherche GPS…'
              : ''}
          </Text>
        </View>
        <Pressable onPress={() => void fermerSession()} hitSlop={8}>
          <Text style={styles.deconnexion}>Se déconnecter</Text>
        </Pressable>
      </View>

      {livraisons.isPending ? (
        <View style={styles.chargement}>
          <SkeletonBlock width="100%" height={96} />
          <SkeletonBlock width="100%" height={96} />
        </View>
      ) : livraisons.isError ? (
        <ScreenMessage
          tone="error"
          title="Connexion impossible"
          message={livraisons.error.message}
          onRetry={() => livraisons.refetch()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.liste}
          refreshControl={
            <RefreshControl
              refreshing={livraisons.isRefetching}
              onRefresh={() => livraisons.refetch()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {commandes.length === 0 ? (
            <View style={styles.vide}>
              <Text style={styles.videIcone}>🛵</Text>
              <Text style={styles.videTitre}>Aucune course pour l'instant</Text>
              <Text style={styles.videTexte}>
                Les livraisons que le gérant t'assigne apparaîtront ici.
              </Text>
            </View>
          ) : (
            <>
              <Section titre="En cours" items={enCours} onOuvrir={ouvrir(router)} />
              <Section
                titre="À récupérer"
                items={aRecuperer}
                onOuvrir={ouvrir(router)}
              />
              <Section
                titre="En préparation"
                items={enPreparation}
                onOuvrir={ouvrir(router)}
              />
            </>
          )}

          <Pressable
            onPress={() => setVoirHistorique((v) => !v)}
            style={styles.historiqueToggle}
          >
            <Text style={styles.historiqueToggleTexte}>
              {voirHistorique ? 'Masquer l’historique' : 'Voir l’historique'}
            </Text>
          </Pressable>
          {voirHistorique ? (
            historique.isPending ? (
              <SkeletonBlock width="100%" height={96} />
            ) : (
              <Section
                titre="Livrées"
                items={historique.data?.commandes ?? []}
                onOuvrir={ouvrir(router)}
              />
            )
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ouvrir(router: ReturnType<typeof useRouter>) {
  return (id: string) =>
    router.push({ pathname: '/livraison/[id]', params: { id } });
}

function Section({
  titre,
  items,
  onOuvrir,
}: {
  titre: string;
  items: Livraison[];
  onOuvrir: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitre}>
        {titre} · {items.length}
      </Text>
      {items.map((livraison) => (
        <CarteCourse
          key={livraison.id}
          livraison={livraison}
          onPress={() => onOuvrir(livraison.id)}
        />
      ))}
    </View>
  );
}

const LABELS: Record<StatutLivraison, string> = {
  RECUE: 'Reçue',
  EN_PREPARATION: 'En préparation',
  PRETE: 'À récupérer',
  EN_LIVRAISON: 'En cours',
  LIVREE: 'Livrée',
  REFUSEE: 'Refusée',
  ANNULEE: 'Annulée',
};

function CarteCourse({
  livraison,
  onPress,
}: {
  livraison: Livraison;
  onPress: () => void;
}) {
  const etablissement = livraison.restaurant ?? livraison.supermarche;
  const total =
    livraison.totalHt + livraison.totalTva + livraison.fraisLivraison;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.carte, pressed && styles.cartePressee]}
    >
      <View style={styles.carteHaut}>
        <Text style={styles.carteTitre} numberOfLines={1}>
          #{livraison.codeLivraison}
          {etablissement ? ` · ${etablissement.nom}` : ''}
        </Text>
        <View
          style={[
            styles.pastille,
            livraison.statutLivraison === 'EN_LIVRAISON' && styles.pastilleActive,
          ]}
        >
          <Text style={styles.pastilleTexte}>
            {LABELS[livraison.statutLivraison]}
          </Text>
        </View>
      </View>
      <Text style={styles.carteAdresse} numberOfLines={1}>
        📍 {livraison.adresseLivraison?.rue ?? 'Adresse inconnue'}
        {livraison.adresseLivraison?.ville
          ? ` · ${livraison.adresseLivraison.ville}`
          : ''}
      </Text>
      <Text style={styles.carteTotal}>
        💵 {formatFCFA(total)} à encaisser
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  enteteTextes: {
    gap: 2,
    flex: 1,
  },
  enteteSous: {
    ...typography.caption,
    fontSize: 12,
  },
  deconnexion: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.danger,
  },
  chargement: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  liste: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitre: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  carte: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    gap: spacing.xs,
    ...shadows.card,
  },
  cartePressee: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  carteHaut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  carteTitre: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
    flex: 1,
  },
  carteAdresse: {
    ...typography.caption,
    fontSize: 12.5,
  },
  carteTotal: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
  pastille: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 1,
    paddingVertical: 3,
    backgroundColor: colors.skeleton,
  },
  pastilleActive: {
    backgroundColor: colors.primarySoft,
  },
  pastilleTexte: {
    ...typography.badge,
    fontSize: 10,
    color: colors.inkMuted,
  },
  vide: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.sm,
  },
  videIcone: {
    fontSize: 42,
  },
  videTitre: {
    ...typography.cardTitle,
    fontSize: 17,
  },
  videTexte: {
    ...typography.caption,
    fontSize: 13,
    textAlign: 'center',
  },
  historiqueToggle: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  historiqueToggleTexte: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
});
