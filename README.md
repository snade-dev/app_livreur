# All-in-One Livreur

App mobile Expo pour les livreurs. Le livreur est un **employé** de
l'établissement (créé dans le Hub avec le rôle **Livreur**, permission
`EFFECTUER_LIVRAISONS`) et se connecte avec son email + mot de passe.

## Fonctionnement

- **Mes livraisons** : la tournée (assignées par le gérant), pollée toutes les 10 s.
- **Détail de course** : client (appel direct), adresse + instructions, carte
  OpenStreetMap (destination + ma position), articles, montant à encaisser.
- **Démarrer la course** (PRETE → EN_LIVRAISON) : active le partage de position.
- **Marquer livrée** : saisie du code à 4 chiffres affiché sur l'app du client ;
  le serveur encaisse la vente et décrémente le stock.
- **Partage de position** : tant qu'une course est en cours et que l'app est au
  premier plan, la position est envoyée toutes les ~10 s (`POST /livreur/position`) ;
  le client et le Hub la lisent en polling.

## Limites MVP

- ⚠️ **Pas de tracking en arrière-plan** : il exige un dev build +
  `expo-task-manager` (impossible dans Expo Go). Pendant une course, l'app doit
  rester ouverte à l'écran. À faire quand on passera aux builds EAS.
- Le login staff ne délivre pas de refresh token : session de 24 h, puis
  reconnexion.

## Démarrage

```bash
cp .env.example .env   # renseigner l'IP locale du PC (pas localhost !)
pnpm install
pnpm start             # Expo Go
```

Compte de test dev : créer un employé livreur via le Hub (rôle Livreur), ou
utiliser `livreur.test@aio.dev` / `LivreurTest123!` (seedé par le script E2E).
