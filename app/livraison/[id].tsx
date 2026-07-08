import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { demarrerLivraison, livrerLivraison } from '@/api/livraisons';
import type { Livraison } from '@/api/types';
import { CarteLivraison, type PointCarte } from '@/components/carte-livraison';
import { ErrorBanner } from '@/components/error-banner';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenMessage } from '@/components/screen-states';
import { useLivraison } from '@/hooks/use-mes-livraisons';
import { formatFCFA } from '@/lib/format';
import { useToast } from '@/providers/toast-provider';
import { colors, fonts, radius, spacing, typography } from '@/theme/tokens';

/**
 * Détail d'une course : client (appel direct), adresse + instructions, carte
 * (destination + ma position), articles et montant à encaisser. Actions :
 * « Démarrer la course » (PRETE → EN_LIVRAISON, active le partage de position)
 * puis « Marquer livrée » avec saisie du code à 4 chiffres du client.
 */
export default function DetailLivraisonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const livraison = useLivraison(id ?? '');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title={
          livraison.data ? `Course #${livraison.data.codeLivraison}` : 'Course'
        }
        onBack={() => router.back()}
      />
      {livraison.isPending ? (
        <View style={styles.centre}>
          <Text style={typography.caption}>Chargement…</Text>
        </View>
      ) : livraison.isError ? (
        <ScreenMessage
          tone="error"
          title="Course introuvable"
          message={livraison.error.message}
          onRetry={() => livraison.refetch()}
        />
      ) : livraison.data ? (
        <Corps livraison={livraison.data} />
      ) : null}
    </SafeAreaView>
  );
}

function Corps({ livraison }: { livraison: Livraison }) {
  const queryClient = useQueryClient();
  const { montrer } = useToast();
  const [maPosition, setMaPosition] = useState<PointCarte | null>(null);
  const [modalCode, setModalCode] = useState(false);
  const [code, setCode] = useState('');

  const etablissement = livraison.restaurant ?? livraison.supermarche;
  const adresse = livraison.adresseLivraison;
  const destination: PointCarte | null =
    adresse?.latitude != null && adresse?.longitude != null
      ? { lat: adresse.latitude, lng: adresse.longitude }
      : null;
  const total =
    livraison.totalHt + livraison.totalTva + livraison.fraisLivraison;
  const statut = livraison.statutLivraison;

  // Ma position (one-shot) pour situer la course sur la carte.
  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (annule || status !== Location.PermissionStatus.GRANTED) return;
        const position =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));
        if (!annule && position) {
          setMaPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        }
      } catch {
        // Sans position, la carte montre au moins la destination.
      }
    })();
    return () => {
      annule = true;
    };
  }, []);

  const invalider = () => {
    void queryClient.invalidateQueries({ queryKey: ['livreur'] });
  };

  const demarrage = useMutation({
    mutationFn: () => demarrerLivraison(livraison.id),
    onSuccess: (maj) => {
      queryClient.setQueryData(['livreur', 'livraison', livraison.id], maj);
      invalider();
      montrer('Course démarrée — le client te suit en direct');
    },
  });

  const remise = useMutation({
    mutationFn: () => livrerLivraison(livraison.id, code),
    onSuccess: (maj) => {
      queryClient.setQueryData(['livreur', 'livraison', livraison.id], maj);
      invalider();
      setModalCode(false);
      montrer(`Livraison confirmée — ${formatFCFA(total)} encaissés`);
    },
  });

  return (
    <>
      <ScrollView contentContainerStyle={styles.contenu}>
        {destination ? (
          <CarteLivraison
            destination={destination}
            livreur={maPosition}
            hauteur={230}
          />
        ) : null}

        <View style={styles.bloc}>
          <Text style={styles.blocTitre}>Client</Text>
          <Pressable
            onPress={() =>
              livraison.client &&
              Linking.openURL(`tel:${livraison.client.telephone}`)
            }
            style={({ pressed }) => [styles.client, pressed && styles.clientPresse]}
          >
            <View style={styles.clientTextes}>
              <Text style={styles.clientNom}>
                {[livraison.client?.prenom, livraison.client?.nom]
                  .filter(Boolean)
                  .join(' ') || 'Client'}
              </Text>
              <Text style={styles.clientTel}>{livraison.client?.telephone}</Text>
            </View>
            <Text style={styles.clientAppel}>📞 Appeler</Text>
          </Pressable>
          <Text style={styles.adresse}>
            📍 {adresse?.rue}
            {adresse?.ville ? ` · ${adresse.ville}` : ''}
          </Text>
          {adresse?.instructionsLivraison ? (
            <Text style={styles.instructions}>
              💬 « {adresse.instructionsLivraison} »
            </Text>
          ) : null}
          {etablissement ? (
            <Text style={styles.depart}>
              🏬 Départ : {etablissement.nom} · {etablissement.adresse}
            </Text>
          ) : null}
        </View>

        <View style={styles.bloc}>
          <Text style={styles.blocTitre}>Commande</Text>
          {livraison.lignesCommande.map((ligne) => (
            <View key={ligne.id} style={styles.ligne}>
              <Text style={styles.ligneQuantite}>{ligne.quantite}×</Text>
              <Text style={styles.ligneNom} numberOfLines={1}>
                {ligne.nomProduitSnapshot}
              </Text>
              <Text style={styles.lignePrix}>
                {formatFCFA(ligne.prixUnitaireSnapshot * ligne.quantite)}
              </Text>
            </View>
          ))}
          {livraison.notes ? (
            <Text style={styles.instructions}>📝 « {livraison.notes} »</Text>
          ) : null}
          <View style={styles.total}>
            <Text style={styles.totalLabel}>À encaisser (frais inclus)</Text>
            <Text style={styles.totalValeur}>{formatFCFA(total)}</Text>
          </View>
        </View>

        {demarrage.isError ? (
          <ErrorBanner titre="Départ impossible." message={demarrage.error.message} />
        ) : null}
      </ScrollView>

      <View style={styles.pied}>
        {statut === 'PRETE' ? (
          <PrimaryButton
            label="🚀 Démarrer la course"
            onPress={() => demarrage.mutate()}
            loading={demarrage.isPending}
          />
        ) : statut === 'EN_LIVRAISON' ? (
          <PrimaryButton
            label="✅ Marquer livrée"
            onPress={() => {
              setCode('');
              remise.reset();
              setModalCode(true);
            }}
          />
        ) : statut === 'EN_PREPARATION' ? (
          <Text style={styles.attente}>
            La commande est en préparation — tu pourras partir dès qu'elle est prête.
          </Text>
        ) : (
          <Text style={styles.attente}>
            {statut === 'LIVREE' ? 'Course terminée ✅' : 'Course close.'}
          </Text>
        )}
      </View>

      {/* Saisie du code de confirmation remis par le client */}
      <Modal
        visible={modalCode}
        transparent
        animationType="fade"
        onRequestClose={() => setModalCode(false)}
      >
        <View style={styles.modalFond}>
          <View style={styles.modalCarte}>
            <Text style={styles.modalTitre}>Code de confirmation</Text>
            <Text style={styles.modalTexte}>
              Demande au client le code à 4 chiffres affiché dans son application.
            </Text>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0000"
              placeholderTextColor={colors.inkFaint}
              style={styles.modalChamp}
              autoFocus
            />
            {remise.isError ? (
              <ErrorBanner titre="Code refusé." message={remise.error.message} />
            ) : null}
            <PrimaryButton
              label={`Confirmer & encaisser ${formatFCFA(total)}`}
              onPress={() => remise.mutate()}
              disabled={code.length !== 4}
              loading={remise.isPending}
            />
            <Pressable onPress={() => setModalCode(false)} style={styles.modalAnnuler}>
              <Text style={styles.modalAnnulerTexte}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenu: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  bloc: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  blocTitre: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  client: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  clientPresse: {
    opacity: 0.7,
  },
  clientTextes: {
    flex: 1,
    gap: 1,
  },
  clientNom: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  clientTel: {
    ...typography.caption,
    fontSize: 13,
  },
  clientAppel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
  adresse: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  instructions: {
    ...typography.caption,
    fontSize: 13,
    fontStyle: 'italic',
  },
  depart: {
    ...typography.caption,
    fontSize: 12.5,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ligneQuantite: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
    minWidth: 26,
  },
  ligneNom: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
  },
  lignePrix: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  totalLabel: {
    ...typography.body,
    color: colors.inkMuted,
  },
  totalValeur: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  pied: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  attente: {
    ...typography.caption,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  modalFond: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCarte: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitre: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
  },
  modalTexte: {
    ...typography.caption,
    fontSize: 13,
    textAlign: 'center',
  },
  modalChamp: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    fontFamily: fonts.bold,
    fontSize: 28,
    letterSpacing: 12,
    textAlign: 'center',
    color: colors.ink,
  },
  modalAnnuler: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  modalAnnulerTexte: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.inkMuted,
  },
});
