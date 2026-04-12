# Spécification technique — Madarail POS

**Version :** 2.0  
**Date :** 2026-04-12  
**Projet :** Système de vente de billets Madarail (Madagascar)

---

## 1. Stack technologique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Runtime JS | Node.js (build uniquement) | — |
| Framework UI | **React** | 18.3.x |
| Langage | **TypeScript** | 5.5.x |
| Build | **Vite** | 7.x |
| Styles | **Tailwind CSS** | 3.4.x |
| Icônes | **Lucide React** | 0.344.x |
| Backend / BDD | **Supabase** (client installé, intégration à venir) | 2.57.x |
| Linter | ESLint + typescript-eslint | 9.x |
| PostCSS | Autoprefixer | — |

---

## 2. Architecture de l'application

### 2.1 Vue d'ensemble

L'application est une **SPA (Single Page Application)** entièrement côté client. La navigation entre les vues est gérée par un état interne (`currentView` dans le contexte global) — sans routeur URL dédié.

```
src/
├── main.tsx
├── App.tsx                        # Shell principal : layout, sidebar, dispatch des vues
├── index.css
├── vite-env.d.ts
├── types/
│   └── index.ts                   # Interfaces TypeScript partagées
├── contexts/
│   └── AppContext.tsx              # État global (Context API + hooks)
├── utils/
│   ├── mockData.ts                 # Données de référence des trajets + DEPARTURE_CITIES
│   ├── format.ts                   # formatAriary() partagé
│   └── seatMaps.ts                 # Configs wagons + buildSeatGrid()
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── MadarailLogo.tsx
│   ├── OfflineIndicator.tsx        # Badge hors-ligne (isOnline du contexte)
│   ├── SeatMap.tsx                 # Plan des sièges (composant headless)
│   └── Sidebar.tsx                 # Navigation principale avec système de rôles
└── pages/
    ├── Login.tsx
    ├── Dashboard.tsx
    ├── POS.tsx
    ├── Products.tsx
    ├── Sales.tsx
    ├── Users.tsx
    ├── Reservation.tsx             # Flow réservation 4 étapes
    └── Bluetooth.tsx               # Sync BT simulée
```

### 2.2 Flux de navigation

```
[Chargement] → currentUser === null → <Login>
                                         ↓ connexion
                              role = 'admin'      → vue 'dashboard'
                              role = 'agent'      → vue 'pos'
                              role = 'controller' → vue 'sales'
                                         ↓
                    <App> → <Sidebar> (navigation filtrée par rôle)
                           → <main> (rendu conditionnel par currentView)
```

### 2.3 Guards de vues

| Vue | Admins | Agents | Contrôleurs |
|-----|:------:|:------:|:-----------:|
| `dashboard` | ✓ | → sales | → sales |
| `pos` | ✓ (rw) | ✓ (rw) | ✓ (readOnly) |
| `routes` | ✓ (rw) | ✓ (ro) | — |
| `sales` | ✓ | ✓ | ✓ |
| `reservation` | ✓ | ✓ | → sales |
| `bluetooth` | — | ✓ | ✓ |
| `users` | ✓ | → sales | → sales |

---

## 3. Modèle de données

### 3.1 Interface `User`

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent' | 'controller';
  gare?: string;    // Nom de ville : 'Antananarivo' | 'Moramanga' | 'Ambila Lemaitso'
  createdAt: string;
}
```

### 3.2 Interface `TrainRoute`

```typescript
interface TrainRoute {
  id: string;
  name: string;                              // "Départ – Arrivée" (généré)
  serviceName?: string;                      // "Train voyageur" | "Micheline «Viko Viko»" | "Trans Lémurie Express"
  operatingDays?: string;                    // "Dimanche, Jeudi"
  departure: string;                         // Gare de départ
  arrival: string;                           // Gare d'arrivée
  category: string;                          // Code ligne : "TCE" | "TA" | "MOR"
  classe: '1ère classe' | '2ème classe' | '3ème classe';
  price: number;                             // Prix HT en Ariary
  seatsAvailable: number;                    // Stock courant (décrémenté à chaque vente/réservation)
  trainNumber: string;
  departureTime: string;                     // "HH:MM"
  arrivalTime: string;                       // "HH:MM"
  duration: string;
}
```

### 3.3 Interface `TicketItem`

```typescript
interface TicketItem {
  route: TrainRoute;          // Snapshot du trajet au moment de l'achat
  quantity: number;
  passengerFirstName: string;
  passengerLastName: string;
  passengerCIN: string;       // Numéro de carte d'identité nationale
  travelDate: string;         // "YYYY-MM-DD"
  seatNumber?: string;        // Ex. "5A" (réservations uniquement)
}
```

### 3.4 Type `PaymentMethod`

```typescript
type PaymentMethod = 'mvola' | 'orange_money' | 'airtel_money';
```

Seul le paiement Mobile Money est accepté. Les opérateurs supportés sont MVola (Telma), Orange Money et Airtel Money.

### 3.5 Interface `Sale`

```typescript
interface Sale {
  id: string;              // "BIL-{timestamp}"
  items: TicketItem[];
  subtotal: number;        // HT
  tax: number;             // TVA 20 %
  total: number;           // TTC
  paymentMethod: PaymentMethod;
  agentId: string;
  agentName: string;
  gare: string;            // Nom de ville (ex. 'Antananarivo')
  createdAt: string;
}
```

### 3.6 Interfaces `Seat` et `SeatMapConfig`

```typescript
type SeatStatus = 'free' | 'reserved' | 'selected' | 'no_show';

interface Seat {
  number: string;                  // Ex. "5A"
  row: number;                     // 1-based
  column: 'A' | 'B' | 'C' | 'D';
  status: SeatStatus;
}

interface SeatMapConfig {
  trainServiceName: string;
  totalSeats: number;
  rows: number;
}
```

### 3.7 Interface `Reservation`

```typescript
interface Reservation {
  id: string;
  routeId: string;
  route: TrainRoute;           // Snapshot
  seatNumber: string;
  passengerFirstName: string;
  passengerLastName: string;
  passengerCIN: string;
  travelDate: string;
  paymentMethod: PaymentMethod;
  total: number;
  subtotal: number;
  tax: number;
  agentId: string;
  agentName: string;
  gare: string;
  status: 'confirmed' | 'no_show' | 'reassigned';
  createdAt: string;
  reassignedTo?: {
    passengerFirstName: string;
    passengerLastName: string;
    passengerCIN: string;
    agentId: string;
    reassignedAt: string;
  };
}
```

---

## 4. Gestion de l'état global (`AppContext`)

### 4.1 Structure du contexte

```typescript
interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  routes: TrainRoute[];
  setRoutes: (routes: TrainRoute[]) => void;
  sales: Sale[];
  addSale: (sale: Sale) => void;
  reservations: Reservation[];
  addReservation: (res: Reservation) => void;
  updateReservationStatus: (id: string, status: Reservation['status'], reassignedTo?: Reservation['reassignedTo']) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  isOnline: boolean;
}
```

### 4.2 Persistance

| Donnée | Stockage | Clé localStorage | Notes |
|--------|----------|------------------|-------|
| `routes` | `localStorage` | `madarail-routes-v3` | Seedé depuis `mockData` si vide |
| `sales` | `localStorage` | `madarail-sales-v2` | Clé v2 : structure `TicketItem` enrichie (3 champs passager) |
| `reservations` | `localStorage` | `madarail-reservations` | Inclut `status` et `reassignedTo` |
| `currentUser` | Mémoire (état React) | — | Non persisté volontairement |
| Sidebar collapsed | `localStorage` | `madarail-sidebar-collapsed` | `"1"` = réduit |

> **Note clé v2** : La clé `madarail-sales-v2` remplace `madarail-sales` pour éviter toute corruption silencieuse lors de la migration depuis l'ancienne structure (`passengerName` → `passengerFirstName/LastName/CIN`).

### 4.3 Mode hors-ligne

```typescript
// AppContext.tsx
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const goOnline  = () => setIsOnline(true);
  const goOffline = () => setIsOnline(false);
  window.addEventListener('online',  goOnline);
  window.addEventListener('offline', goOffline);
  return () => {
    window.removeEventListener('online',  goOnline);
    window.removeEventListener('offline', goOffline);
  };
}, []);
```

`isOnline` est exposé dans le contexte global et consommé par `OfflineIndicator` et `Sidebar`.

---

## 5. Logique métier critique

### 5.1 Filtrage des trajets par gare

```typescript
// POS.tsx et Reservation.tsx
const agentRoutes = currentUser?.role === 'admin'
  ? routes
  : routes.filter(r => r.departure === currentUser?.gare);
```

La propriété `User.gare` stocke directement le nom de ville (ex. `'Antananarivo'`), qui correspond à `TrainRoute.departure`. Le filtre est donc une simple égalité de chaîne.

### 5.2 Contrôle de stock (POS)

**Niveau 1 — Ajout au panier :**
```typescript
const qtyAlready = cart
  .filter(i => i.route.id === selectedRoute.id)
  .reduce((s, i) => s + i.quantity, 0);

if (qtyAlready + 1 > selectedRoute.seatsAvailable) {
  alert('Plus de places disponibles');
}
```

**Niveau 2 — Double vérification au paiement :**
```typescript
for (const [routeId, qty] of seatsByRouteId) {
  const r = routes.find(x => x.id === routeId);
  if (!r || r.seatsAvailable < qty) {
    alert('Pas assez de places disponibles');
    return;
  }
}
```

### 5.3 Contrôle de disponibilité du siège (Réservation)

```typescript
// Reservation.tsx — handleConfirmPayment
const currentReservations = reservations.filter(
  r => r.routeId === selectedRoute.id &&
       r.travelDate === form.travelDate &&
       r.status === 'confirmed' &&
       r.seatNumber === selectedSeat
);
if (currentReservations.length > 0) {
  alert('Ce siège vient d\'être réservé. Veuillez en choisir un autre.');
  return;
}
```

Ce double-check protège contre les conflits dans un scénario multi-agent (même gare, même instant).

### 5.4 Réattribution de siège (passager non-présenté)

1. L'agent clique "Non présenté" → `updateReservationStatus(id, 'no_show')`.
2. Le siège repasse à `free` dans `buildSeatGrid` (statut `no_show` traité comme `free`).
3. L'agent clique "Réattribuer" → modal avec nouveau formulaire passager + `SeatMap`.
4. `handleConfirmReassign` :
   - Crée une nouvelle `Reservation` avec le même siège.
   - Met à jour l'originale avec `status: 'reassigned'` et `reassignedTo`.

### 5.5 Calcul TVA

```typescript
const subtotal = total_HT;
const tax = subtotal * 0.2;   // TVA 20 %
const total = subtotal + tax;
```

### 5.6 Génération des IDs

```typescript
// Vente
id: `BIL-${Date.now()}`   // Ex. "BIL-1712926800000"

// Réservation
id: `RES-${Date.now()}`   // Ex. "RES-1712926800000"
```

---

## 6. Plan des sièges (`seatMaps.ts`)

### 6.1 Configurations disponibles

| Service | Places | Rangées |
|---------|:------:|:-------:|
| Train voyageur | 88 | 22 |
| Trans Lémurie Express | 52 | 13 |
| Micheline « Viko Viko » | 20 | 5 |

### 6.2 Layout

Disposition 2+2 : colonnes **A**, **B** | allée | **C**, **D**.  
Numérotation : `'1A'`, `'1B'`, `'1C'`, `'1D'`, `'2A'`…

```typescript
// buildSeatGrid(serviceName, reservedSeats): Seat[][]
// - reservedSeats: string[] — numéros de sièges déjà réservés (status 'confirmed')
// - retourne un tableau de rangées, chaque rangée contenant 4 Seat (A, B, C, D)
```

### 6.3 Composant `SeatMap`

Composant **purement présentationnel** (headless) — tout l'état est géré par le parent `Reservation.tsx`.

```typescript
interface SeatMapProps {
  seats: Seat[][];
  selectedSeat: string | null;
  onSeatSelect: (seatNumber: string) => void;
  config: SeatMapConfig;
}
```

Grille CSS : `grid-cols-[1.5rem_1fr_1fr_0.75rem_1fr_1fr]` (n° rangée + A + B + allée + C + D).

---

## 7. Système de rôles (Sidebar)

```typescript
interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  roles?: Array<'admin' | 'agent' | 'controller'>;
}

// Filtre appliqué :
const visibleItems = menuItems.filter(
  item => !item.roles || item.roles.includes(currentUser?.role)
);
```

| Item | Rôles autorisés |
|------|----------------|
| Tableau de bord | admin |
| Point de vente | admin, agent, controller |
| Trajets | admin, agent |
| Historique des ventes | (tous) |
| Réservations | admin, agent |
| Synchronisation BT | agent, controller |
| Utilisateurs | admin |

---

## 8. Synchronisation Bluetooth (simulation)

La page `Bluetooth.tsx` simule le flux de synchronisation via des `setTimeout` séquentiels. Elle n'utilise pas la Web Bluetooth API réelle.

### 8.1 États

```
idle → scanning → connecting → transferring → done
                                           ↘ error (simulation uniquement)
```

### 8.2 Prérequis réels (non implémentés)

- Connexion **HTTPS** obligatoire pour Web Bluetooth API.
- Appareils compatibles **BLE** (Bluetooth Low Energy).
- Geste utilisateur explicite pour initier la connexion (contrainte navigateur).

### 8.3 Données affichées

- Nombre de ventes en attente (`sales.length`)
- Nombre de réservations confirmées (`reservations.filter(r => r.status === 'confirmed').length`)

---

## 9. Composants réutilisables

### 9.1 `Button`

Props : `variant` (`'primary'` | `'secondary'`), `size`, `disabled`, `onClick`, `type`, `className`.

### 9.2 `Card`

Conteneur blanc avec ombre. Prop optionnelle `title`.

### 9.3 `Input`

Champ formulaire avec label intégré. Props : `label`, `type`, `placeholder`, `value`, `onChange`, `required`, `min`, `className`.

### 9.4 `MadarailLogo`

SVG inline. Prop `className`.

### 9.5 `Sidebar`

Navigation principale, rétractable desktop, tiroir mobile. Lit `isOnline` du contexte pour afficher un badge hors-ligne.

### 9.6 `OfflineIndicator`

Retourne `null` si `isOnline === true`. Sinon affiche un badge amber.  
Prop `compact?: boolean` : si `true`, affiche uniquement l'icône (pour le header mobile).

### 9.7 `SeatMap`

Voir §6.3.

---

## 10. Utilitaires partagés

### 10.1 `formatAriary(amount: number): string`

```typescript
// src/utils/format.ts
export function formatAriary(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' Ar';
}
```

Utilisé par : `Dashboard`, `POS`, `Products`, `Sales`, `Reservation`.

### 10.2 `DEPARTURE_CITIES`

```typescript
// src/utils/mockData.ts
export const DEPARTURE_CITIES: string[] = [
  'Antananarivo',
  'Moramanga',
  'Ambila Lemaitso',
];
```

Utilisé dans : `Users.tsx` (select gare), `Login.tsx` (mock gare).

---

## 11. Charte graphique technique

### 11.1 Palette de couleurs (Tailwind config)

```javascript
colors: {
  madarail: {
    navy:         '#0a2341',
    'navy-mid':   '#0f2d4a',
    'navy-bright':'#153a5c',
    red:          '#e30613',
    'red-dark':   '#b3050f',
    'red-soft':   '#fef2f2',
    'red-muted':  '#fecaca',
    rail:         '#f4f8fb',
  }
}
```

### 11.2 Responsive breakpoints

| Breakpoint | Largeur | Comportement |
|-----------|---------|--------------|
| Mobile | < 640 px | Navigation tiroir, colonnes empilées, bottom sheet Mobile Money |
| Tablet | 640–1024 px | Grilles 2 colonnes, sidebar masquée |
| Desktop | ≥ 1024 px | Sidebar visible, POS 2 colonnes |
| Large | ≥ 1280 px | POS : catalogue 3 colonnes + panier fixe droite |

---

## 12. Configuration Vite & TypeScript

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
```

- `tsconfig.json` — référence `tsconfig.app.json` et `tsconfig.node.json`
- `tsconfig.app.json` — source React (ES2020, JSX React)
- `tsconfig.node.json` — `vite.config.ts` (Node, ESNext)

---

## 13. Intégration Supabase (état actuel et cible)

### 13.1 État actuel

`@supabase/supabase-js` installé mais non utilisé. Données en localStorage.

### 13.2 Axes d'intégration prioritaires

| Donnée | Action requise |
|--------|---------------|
| Authentification | `supabase.auth.signIn` + table `profiles` (role, gare) |
| Ventes | `supabase.from('sales').insert(...)` après chaque paiement |
| Réservations | `supabase.from('reservations').insert/update(...)` |
| Trajets | Migrer localStorage → table `routes` |
| Sync BT | `supabase.from('sales').upsert(...)` depuis la tablette contrôleur |

### 13.3 Variables d'environnement

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 14. Scripts disponibles

```bash
npm run dev        # Serveur de développement (HMR) — http://localhost:5173
npm run build      # Build de production → dist/
npm run preview    # Prévisualisation du build
npm run lint       # ESLint
npm run typecheck  # Vérification TypeScript (0 émission)
```

---

## 15. Points d'attention et dette technique

| Point | Priorité | Description |
|-------|:--------:|-------------|
| Authentification mock | Haute | Rôle déduit de l'email ; tout mot de passe fonctionne |
| ID non-UUID | Moyenne | `BIL-{timestamp}` et `RES-{timestamp}` — collision possible multi-guichet simultané |
| Stock non-transactionnel | Haute | Sans backend, deux agents peuvent vendre/réserver la même place en parallèle |
| Snapshot TrainRoute dans items | Moyenne | Prix/données copiés — correct pour l'audit, mais poids dans localStorage |
| Users en état local | Faible | Liste utilisateurs non partagée entre sessions |
| TVA hardcodée à 20 % | Faible | À paramétrer en base de données |
| Bluetooth simulé | Haute | La vraie Web Bluetooth API requiert HTTPS + gesture utilisateur + matériel BLE |
| Mode hors-ligne partiel | Haute | `isOnline` détecte la déconnexion mais n'implémente pas de file de synchronisation réelle |
