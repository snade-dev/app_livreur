/**
 * Design tokens — direction « Marché vivant » (v2).
 * Palette verte plus saturée + accent mangue, dégradés immersifs, ombres
 * teintées. Toute couleur / typo / espacement de l'app vient d'ici : aucune
 * valeur en dur dans les écrans.
 */

export const colors = {
  /** Vert primaire vif — actions, prix, éléments actifs. */
  primary: '#16A05A',
  primaryPressed: '#0F7E46',
  /** Fond doux dérivé du primaire (badges, placeholders). */
  primarySoft: '#E2F6EA',
  /** Bordure/anneau teintés primaire (pastilles, contours actifs). */
  primaryRing: '#B9E8CD',

  /** Accent mangue — pastilles, badge panier, touches chaleureuses. */
  accent: '#F4842C',
  accentSoft: '#FEEFDE',

  /** Encre principale (textes). */
  ink: '#14211A',
  inkMuted: '#5A6B60',
  inkFaint: '#8CA095',

  /** Vert forêt profond — en-têtes immersifs. */
  forest: '#0B3B23',
  /** Étapes du dégradé héros (forêt → vert vif adouci). */
  heroTop: '#0C4527',
  heroBottom: '#188A4E',
  /** Textes posés sur les fonds héros/forêt. */
  onHero: '#FFFFFF',
  onHeroMuted: 'rgba(255,255,255,0.78)',
  onHeroFaint: 'rgba(255,255,255,0.22)',

  /** Fonds. */
  background: '#F5F9F5',
  surface: '#FFFFFF',
  border: '#E2EAE4',
  skeleton: '#EAF1EB',
  /** Fond neutre verdi des encarts d'information. */
  mist: '#EFF5F0',

  /** Accent chaud (badge restaurant). */
  warmSoft: '#FCEFDC',
  warmInk: '#AD6212',

  danger: '#C24439',
  dangerPressed: '#9E362D',
  dangerSoft: '#FAECEA',
  /** Bordure des encarts d'erreur doux. */
  dangerBorder: '#F1DBD7',
} as const;

/** Familles Hanken Grotesk chargées dans le layout racine. */
export const fonts = {
  regular: 'HankenGrotesk_400Regular',
  medium: 'HankenGrotesk_500Medium',
  semiBold: 'HankenGrotesk_600SemiBold',
  bold: 'HankenGrotesk_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/** Ombres teintées forêt (iOS: shadow*, Android: elevation) — relief doux. */
export const shadows = {
  card: {
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  raised: {
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 7,
  },
  /** Éléments posés au-dessus du contenu (barre panier, tab bar). */
  floating: {
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;

export const typography = {
  screenTitle: { fontFamily: fonts.bold, fontSize: 28, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, color: colors.inkMuted },
  cardTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  caption: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkMuted },
  badge: { fontFamily: fonts.semiBold, fontSize: 11 },
  button: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.surface },
} as const;
