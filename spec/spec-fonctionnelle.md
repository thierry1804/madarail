# Spécification fonctionnelle — Madarail POS

**Version :** 1.2  
**Date :** 2026-04-12  
**Projet :** Système de vente de billets Madarail (Madagascar)

---

## 1. Contexte et objectifs

### 1.1 Présentation

Madarail est l'opérateur ferroviaire de Madagascar. Cette application est un **système de point de vente (POS) de guichet** déployé dans l'ensemble des points d'arrêt du réseau ferroviaire (gares et arrêts), permettant à des agents de vendre et réserver des billets de train, et à des administrateurs de piloter l'activité commerciale.

### 1.2 Objectifs métier

- Permettre la vente et la réservation de billets en gare et dans les arrêts sans infrastructure
- Assurer le suivi des places disponibles en temps réel par trajet
- Synchroniser les ventes réalisées hors connexion dès qu'une connexion est disponible
- Offrir aux administrateurs une vision consolidée des recettes et de l'activité
- Centraliser la gestion des trajets, tarifs et utilisateurs

### 1.3 Profils utilisateurs

| Profil | Contexte d'usage |
|--------|-----------------|
| **Agent de guichet** | Vend et réserve des billets en face à face dans une gare connectée (fibre), utilise le POS sur tablette ou smartphone en continu |
| **Agent d'arrêt** | Même rôle et même application qu'un agent de guichet, mais opère dans un point d'arrêt sans connexion Internet. Les ventes sont transmises au contrôleur via Bluetooth |
| **Contrôleur** | Reçoit les données de vente des agents d'arrêt via Bluetooth sur sa tablette. Pas de vente directe. Synchronise automatiquement les données vers le serveur dès qu'une connexion est disponible |
| **Administrateur** | Pilote l'activité depuis le bureau : tableau de bord, gestion des trajets et des utilisateurs |

---

## 2. Déploiement et connectivité

### 2.1 Types de points d'exploitation

| Type | Connectivité | Appareils | Exemple |
|------|-------------|-----------|---------|
| **Gare** | Fibre (connexion permanente) | Tablette ou smartphone | Antananarivo, Toamasina |
| **Arrêt** | Aucune connexion Internet | Tablette ou smartphone | Arrêts intermédiaires sans infrastructure |

Un arrêt est un point où des passagers montent et descendent du train, mais sans gare physique ni connexion réseau. L'interface de l'application y est identique à celle d'une gare.

### 2.2 Filtrage des trajets par point d'exploitation

Chaque agent (gare ou arrêt) ne voit dans le catalogue que les **trajets dont la gare de départ correspond à son point d'affectation**. Ce filtrage est appliqué automatiquement à la connexion selon le champ `gare` du compte utilisateur (nom de ville, ex. `Antananarivo`), qui est mis en correspondance directe avec le champ `departure` de chaque trajet.

### 2.3 Flux de synchronisation hors ligne

```
Agent d'arrêt (hors ligne)
        │  Vente saisie dans l'app
        │  Transfert manuel via Bluetooth
        ▼
Contrôleur (tablette, sur le train)
        │  Reçoit toutes les données de l'app de l'agent
        │  Synchronisation automatique dès connexion disponible
        ▼
Serveur central (Supabase)
```

- Le transfert Bluetooth est initié **manuellement par l'agent d'arrêt**
- La synchronisation vers le serveur est **automatique** dès que la tablette du contrôleur détecte une connexion Internet (typiquement à l'arrivée en gare)
- Le contrôleur ne vend aucun billet

---

## 3. Périmètre fonctionnel

### 3.1 Vue d'ensemble des modules

```
Madarail POS
├── Authentification
├── Tableau de bord              (admin uniquement)
├── Vente de billets (POS)       (agent, contrôleur, admin)
├── Réservation avec plan sièges (agent, contrôleur, admin)
├── Gestion des trajets          (lecture : tous / écriture : admin)
├── Historique des ventes        (tous)
├── Réattribution de siège       (agent en gare)
└── Gestion des utilisateurs     (admin uniquement)
```

### 3.2 Matrice des droits

| Fonctionnalité | Agent | Contrôleur | Admin |
|----------------|:-----:|:----------:|:-----:|
| Se connecter | ✓ | ✓ | ✓ |
| Vendre des billets | ✓ | — | ✓ |
| Réserver un billet (avec plan sièges) | ✓ | — | ✓ |
| Réattribuer un siège (passager absent) | ✓ | — | ✓ |
| Consulter les trajets | ✓ | ✓ | ✓ |
| Créer / modifier / supprimer un trajet | — | — | ✓ |
| Voir l'historique des ventes | ✓ | ✓ | ✓ |
| Exporter les ventes (CSV) | ✓ | ✓ | ✓ |
| Tableau de bord analytique | — | — | ✓ |
| Gérer les utilisateurs | — | — | ✓ |
| Transférer données via Bluetooth | ✓ (arrêt) | ✓ | — |

---

## 4. Authentification

### 4.1 Connexion

- L'utilisateur saisit son **adresse e-mail** et son **mot de passe**
- Le système détermine le rôle et la gare d'affectation de l'utilisateur
- Après connexion, redirection automatique :
  - **Admin** → Tableau de bord
  - **Agent** → Caisse billets (POS)
  - **Contrôleur** → Historique des ventes

### 4.2 Déconnexion

- Accessible depuis la barre latérale à tout moment
- Retour à l'écran de connexion ; la session est effacée

### 4.3 Comportement de la session

- La gare ou l'arrêt d'affectation est associé au compte (champ `gare`, nom de ville)
- Ce champ filtre automatiquement les trajets visibles dans le catalogue (comparaison directe avec `TrainRoute.departure`)
- Toute vente enregistre automatiquement le point d'exploitation et le nom de l'agent
- Le contrôleur accède au POS en mode **lecture seule** : il consulte les billets mais ne peut ni vendre ni réserver

---

## 5. Module Tableau de bord

> Accessible aux administrateurs uniquement.

### 5.1 Indicateurs temps réel (session du jour)

| Indicateur | Description |
|-----------|-------------|
| **Recettes du jour** | Somme des totaux TTC de toutes les ventes de la journée |
| **Billets vendus** | Nombre total de billets (toutes transactions confondues) |
| **Transactions** | Nombre de passages en caisse |
| **Panier moyen** | Recettes du jour / nombre de transactions |
| **Trajets actifs** | Nombre de trajets ayant encore des places disponibles |

### 5.2 Graphiques et listes

- **Top 5 des trajets les plus vendus** : classés par revenus décroissants, affiche départ→arrivée, classe, quantité vendue et montant
- **Répartition des opérateurs Mobile Money** : barres de progression pour MVola, Orange Money, Airtel Money (nombre et pourcentage)
- **Histogramme des ventes par heure** : revenus cumulés par tranche horaire sur 24h (0h–23h)

---

## 6. Module Vente de billets (POS)

Cœur de l'application, conçu pour une utilisation intensive sur tablette et smartphone.

### 6.1 Interface

L'écran est divisé en deux zones :

- **Zone principale (catalogue)** : liste des trajets disponibles avec filtres
- **Zone latérale (panier)** : billets sélectionnés, saisie passager, récapitulatif et paiement

### 6.2 Catalogue de trajets

Le catalogue n'affiche que les trajets dont la **gare de départ correspond à la gare d'affectation de l'agent connecté**.

#### Filtres disponibles

| Filtre | Options |
|--------|---------|
| **Recherche textuelle** | Gare d'arrivée, numéro de train, nom du service |
| **Service** | Tous / Train voyageur / Micheline « Viko Viko » / Trans Lémurie Express |
| **Ligne** | Toutes / Tana–Côte Est (TCE) / Tana–Antsirabe (TA) / Moramanga–Ambila (MOR) |

#### Carte trajet

Chaque trajet affiche :
- Nom du service et numéro de train
- Gare de départ → gare d'arrivée
- Horaires de départ et d'arrivée, durée
- Jours d'exploitation
- Classe (1ère / 2ème / 3ème)
- Prix en Ariary (Ar)
- Statut des places disponibles :
  - **Disponible** (≥ 10 places) — vert
  - **Stock faible** (1–9 places) — orange
  - **Complet** (0 place) — rouge, sélection désactivée

Les trajets complets sont affichés séparément, en bas du catalogue, visuellement grisés.

### 6.3 Données passager à saisir

Pour chaque billet, l'agent saisit :

| Champ | Saisie | Obligatoire |
|-------|--------|:-----------:|
| Nom | Manuel | ✓ |
| Prénom | Manuel | ✓ |
| Numéro de carte d'identité (CIN) | Manuel | ✓ |
| Trajet | Sélection dans le catalogue | ✓ |
| Date de voyage | Sélection (min. aujourd'hui) | ✓ |
| Date et heure de transaction | Automatique | — |

> Pour une transaction multi-billets, les données d'identité ne sont saisies que pour **un seul passager référent** (comportement actuel, susceptible d'évoluer).

### 6.4 Ajout au panier

1. L'agent sélectionne un trajet dans le catalogue
2. Saisit les données du passager (nom, prénom, CIN)
3. Confirme la date de voyage
4. Clique sur **"Ajouter au panier"**

Contrôles de cohérence :
- Impossible d'ajouter si aucun trajet sélectionné ou champs obligatoires incomplets
- Impossible de dépasser le nombre de places disponibles pour un trajet donné

### 6.5 Gestion du panier

- Chaque ligne affiche : trajet, numéro de train, nom du passager, quantité, sous-total
- Les **quantités** sont modifiables avec les boutons +/−
  - La diminution à 0 supprime la ligne
  - L'augmentation est bloquée si le stock est insuffisant
- Chaque ligne peut être **supprimée** individuellement

### 6.6 Calcul du montant

```
Sous-total = Σ (prix_trajet × quantité)
TVA (20 %) = Sous-total × 0,20
Total TTC  = Sous-total + TVA
```

### 6.7 Encaissement

Le seul mode de paiement accepté est le **Mobile Money**. L'agent sélectionne l'opérateur :

| Opérateur | |
|-----------|-|
| MVola | |
| Orange Money | |
| Airtel Money | |

> La sélection de l'opérateur est à titre **informatif** dans la version actuelle (pas d'intégration API de paiement).

À la validation :
1. Vérification finale du stock disponible
2. Création de la transaction avec horodatage, agent, gare, opérateur Mobile Money
3. Déduction des places vendues du stock de chaque trajet concerné
4. Vidage du panier

---

## 7. Module Réservation avec plan des sièges

### 7.1 Principe

La réservation est une **vente de billet avec choix de siège**, dont le voyage est prévu à une date future. Le paiement est immédiat : le siège est bloqué dès la confirmation du paiement.

Il n'existe pas de réservation sans paiement immédiat.

### 7.2 Flux de réservation

1. L'agent sélectionne un trajet dans le catalogue
2. Saisit les données du passager (nom, prénom, CIN)
3. Choisit la date de voyage
4. Accède au **plan des sièges** du train correspondant
5. Sélectionne un siège disponible sur le plan
6. Confirme le paiement via Mobile Money
7. Le siège est immédiatement marqué comme réservé

### 7.3 Plan des sièges

- Chaque service ferroviaire dispose de sa propre configuration de sièges :
  - Train voyageur : 88 places
  - Trans Lémurie Express : 52 places
  - Micheline « Viko Viko » : 20 places
- Les sièges sont numérotés et représentés visuellement sur un plan
- Un siège peut être dans l'un des états suivants :

| État | Affichage |
|------|-----------|
| **Libre** | Sélectionnable (fond clair) |
| **Réservé / vendu** | Non sélectionnable (fond coloré) |
| **Sélectionné** | En cours de sélection par l'agent (surligné) |

> La configuration exacte des wagons (disposition des sièges, numérotation) est à définir avec le client.

### 7.4 Pour l'achat de billet simple (sans réservation)

Le passager n'a **pas accès au plan des sièges**. Le siège n'est pas assigné nominativement lors d'un achat au guichet sans réservation.

### 7.5 Réattribution de siège (passager absent)

Si un passager ayant effectué une réservation ne se présente pas au départ :

1. L'agent en gare accède à la liste des réservations du trajet concerné
2. Identifie le siège non présenté
3. Peut le réattribuer à un autre passager

> La politique d'annulation et de remboursement n'est pas encore définie.

---

## 8. Module Gestion des trajets

### 8.1 Liste des trajets

Tableau affichant pour chaque trajet :
- Service commercial et numéro de train
- Départ → Arrivée
- Code ligne
- Classe
- Horaires (départ – arrivée) et durée
- Jours d'exploitation
- Prix (Ariary)
- Places disponibles (code couleur : vert ≥ 30, jaune 10–29, rouge < 10, gris = 0)

Une **barre de recherche** permet de filtrer par gare, service ou code ligne.

### 8.2 Création / modification d'un trajet (admin)

| Champ | Obligatoire | Exemple |
|-------|:-----------:|---------|
| Gare de départ | ✓ | Antananarivo |
| Gare d'arrivée | ✓ | Antsirabe |
| Numéro de train | ✓ | TLE-TA |
| Code ligne | ✓ | TA |
| Classe | ✓ | 2ème classe |
| Heure de départ | ✓ | 06:00 |
| Heure d'arrivée | ✓ | 11:00 |
| Durée | ✓ | 5h00 |
| Prix (Ar) | ✓ | 32 000 |
| Places disponibles | ✓ | 52 |
| Nom du service | — | Trans Lémurie Express |
| Jours d'exploitation | — | Dimanche, Jeudi |

### 8.3 Suppression (admin)

- Confirmation requise avant suppression
- La suppression est immédiate et irréversible

### 8.4 Accès agents

- Les agents voient la liste en lecture seule
- Les boutons Créer / Modifier / Supprimer ne sont pas affichés

---

## 9. Module Historique des ventes

### 9.1 Statistiques globales (en-tête)

- Total des ventes (cumul toutes périodes, TTC)
- Nombre de transactions
- Panier moyen
- TVA collectée

### 9.2 Tableau des transactions

Colonnes : ID, Date & Heure, Agent, Gare/Arrêt, Nombre de billets, Total TTC, Opérateur Mobile Money, Action (détail)

### 9.3 Détail d'une vente

Fenêtre modale affichant :
- Métadonnées : date, agent, gare/arrêt, opérateur Mobile Money
- Liste des billets : trajet, classe, numéro de train, nom du passager, CIN, date de voyage, numéro de siège (si réservation), prix unitaire × quantité
- Récapitulatif : sous-total, TVA 20 %, total TTC

### 9.4 Export CSV

- Déclenché par le bouton **"Exporter CSV"**
- Fichier nommé : `billets-madarail-YYYY-MM-DD.csv`
- Séparateur : point-virgule (`;`)
- Colonnes : ID, Date, Agent, Gare/Arrêt, Nombre de billets, Sous-total, TVA, Total, Opérateur

---

## 10. Module Gestion des utilisateurs

> Accessible aux administrateurs uniquement.

### 10.1 Liste des utilisateurs

Statistiques : total, nombre d'administrateurs, nombre d'agents, nombre de contrôleurs.

Tableau : Nom, Email, Rôle (badge coloré : bleu = admin, rouge = agent, ambre = contrôleur), Point d'exploitation affecté, Date de création, Actions (modifier / supprimer).

### 10.2 Création / modification

| Champ | Obligatoire | Détail |
|-------|:-----------:|--------|
| Nom complet | ✓ | Texte libre |
| Email | ✓ | Identifiant de connexion |
| Rôle | ✓ | Admin / Agent / Contrôleur |
| Point d'exploitation | ✓ | Sélection parmi : Antananarivo, Moramanga, Ambila Lemaitso |

### 10.3 Suppression

Confirmation requise avant suppression.

---

## 11. Offre commerciale Madarail (données de référence)

### 11.1 Services ferroviaires

| Service | Capacité max. | Type |
|---------|:------------:|------|
| Train voyageur | 88 places | Train classique |
| Micheline « Viko Viko » | 20 places | Autorail léger |
| Trans Lémurie Express | 52 places | Express |

### 11.2 Lignes et points d'arrêt

| Code | Nom complet | Points desservis (exemples) |
|------|-------------|----------------------------|
| **TCE** | Tana – Côte Est | Antananarivo, Manjakandriana, Andasibe, Toamasina |
| **TA** | Tana – Antsirabe | Antananarivo, Behenjy, Ambatolampy, Antsirabe |
| **MOR** | Moramanga – Ambila | Moramanga, Ambila Lemaitso |

### 11.3 Grille tarifaire indicative (Ariary)

| Trajet | Micheline | Trans Lémurie | Train voyageur |
|--------|:---------:|:-------------:|:--------------:|
| Tana – Manjakandriana | 8 000 | 10 000 | — |
| Tana – Andasibe | 22 000 | 26 000 | — |
| Tana – Toamasina | 45 000 | 52 000 | — |
| Tana – Behenjy | 7 500 | 9 000 | — |
| Tana – Ambatolampy | 14 000 | 16 000 | — |
| Tana – Antsirabe | 28 000 | 32 000 | — |
| Moramanga – Ambila | — | — | 48 000 |

### 11.4 Fiscalité

TVA applicable : **20 %** sur le prix HT du billet.

---

## 12. Exigences non fonctionnelles

### 12.1 Appareils cibles

- **Tablettes et smartphones** (Android / iOS) — interface principale
- Grands écrans desktop pour les administrateurs
- L'interface doit être entièrement opérable au toucher (pas de dépendance à la souris)

### 12.2 Responsive

- Navigation via tiroir latéral sur mobile/tablette
- Bandeau fixe en bas d'écran sur mobile pour accès rapide à la caisse
- Layout deux colonnes sur les écrans ≥ 1024 px (catalogue + panier côte à côte)

### 12.3 Mode hors ligne

- L'application doit rester fonctionnelle sans connexion Internet (agents d'arrêt)
- Les données sont chargées et mises en cache localement à la connexion
- Les ventes réalisées hors ligne sont stockées localement en attente de synchro Bluetooth

### 12.4 Langue

- Interface entièrement en **français**
- Formatage monétaire : convention française (espace comme séparateur de milliers, suffixe ` Ar`)

### 12.5 Disponibilité

- Application web progressive (PWA) accessible depuis tout navigateur moderne (Chrome, Firefox, Edge, Safari)
- Synchronisation automatique en arrière-plan dès rétablissement de la connexion (contrôleur)

---

## 13. Points ouverts (à préciser avec le client)

| # | Sujet | Statut |
|---|-------|--------|
| 1 | Configuration exacte des plans de sièges (numérotation, disposition par wagon) | En attente |
| 2 | Politique d'annulation et de remboursement des réservations | En attente |
| 3 | Données d'identité pour les billets multi-passagers (CIN individuel ou non) | Décision provisoire : 1 CIN pour le groupe |
| 4 | Liste complète des gares et arrêts du réseau avec leurs codes | En attente |
| 5 | Intégration API Mobile Money (MVola, Orange Money, Airtel Money) | Hors périmètre v1 |
| 6 | Protocole Bluetooth : standard technique utilisé (BLE, Bluetooth classique, app dédiée) | En attente |
| 7 | Gestion des correspondances inter-lignes | Non abordée |
