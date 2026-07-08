/** Enveloppe standard de l'API : `{ success, message, data }`. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}

// ─── Session staff (login-staff) ─────────────────────────────────────────────
// Le livreur est un employé (`Utilisateur`) : email + mot de passe, token 24 h
// SANS refresh token — à expiration, l'app redemande la connexion.

export interface ProfilLivreur {
  id: string;
  userType: string;
  email: string;
  nom: string;
  prenom: string;
  role?: string;
  permissions: string[];
  etablissement?: { id: string; nom?: string };
}

export interface SessionLivreur {
  accessToken: string;
  user: ProfilLivreur;
  expiresIn: string;
}

// ─── Mes livraisons (`/livreur/*`) ───────────────────────────────────────────
// Miroir du contrat backend. Le code de confirmation n'est JAMAIS renvoyé au
// livreur : c'est le client qui le lui donne à la remise.

export type StatutLivraison =
  | 'RECUE'
  | 'EN_PREPARATION'
  | 'PRETE'
  | 'EN_LIVRAISON'
  | 'LIVREE'
  | 'REFUSEE'
  | 'ANNULEE';

export interface LigneLivraison {
  id: string;
  nomProduitSnapshot: string;
  prixUnitaireSnapshot: number;
  quantite: number;
}

export interface AdresseLivraison {
  rue: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  instructionsLivraison: string | null;
}

export interface EtablissementLivraison {
  id: string;
  nom: string;
  adresse: string;
  latitude: number;
  longitude: number;
}

export interface Livraison {
  id: string;
  statutLivraison: StatutLivraison;
  totalHt: number;
  totalTva: number;
  fraisLivraison: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  codeLivraison: string;
  adresseLivraison: AdresseLivraison | null;
  client: { nom: string | null; prenom: string | null; telephone: string } | null;
  supermarche: EtablissementLivraison | null;
  restaurant: EtablissementLivraison | null;
  lignesCommande: LigneLivraison[];
}

export interface PaginationLivraison {
  page: number;
  limit: number;
  total: number;
}
