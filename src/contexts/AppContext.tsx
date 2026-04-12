import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User, TrainRoute, Sale, Reservation } from '../types';

const ROUTES_STORAGE_KEY       = 'madarail-routes-v3';
const SALES_STORAGE_KEY        = 'madarail-sales-v2';
const RESERVATIONS_STORAGE_KEY = 'madarail-reservations';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T;
      if (parsed !== null && parsed !== undefined) return parsed;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

function loadRoutesFromStorage(): TrainRoute[] {
  const parsed = loadFromStorage<TrainRoute[]>(ROUTES_STORAGE_KEY, []);
  return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  routes: TrainRoute[];
  setRoutes: (routes: TrainRoute[]) => void;
  sales: Sale[];
  addSale: (sale: Sale) => void;
  reservations: Reservation[];
  addReservation: (r: Reservation) => void;
  updateReservationStatus: (
    id: string,
    status: Reservation['status'],
    reassignedTo?: Reservation['reassignedTo']
  ) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  isOnline: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [routes, setRoutes] = useState<TrainRoute[]>(loadRoutesFromStorage);
  const [sales, setSales] = useState<Sale[]>(() =>
    loadFromStorage<Sale[]>(SALES_STORAGE_KEY, [])
  );
  const [reservations, setReservations] = useState<Reservation[]>(() =>
    loadFromStorage<Reservation[]>(RESERVATIONS_STORAGE_KEY, [])
  );
  const [currentView, setCurrentView] = useState('login');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Persistance routes
  useEffect(() => {
    if (routes.length > 0) saveToStorage(ROUTES_STORAGE_KEY, routes);
  }, [routes]);

  // Persistance ventes
  useEffect(() => {
    saveToStorage(SALES_STORAGE_KEY, sales);
  }, [sales]);

  // Persistance réservations
  useEffect(() => {
    saveToStorage(RESERVATIONS_STORAGE_KEY, reservations);
  }, [reservations]);

  // Indicateur hors-ligne
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

  const addSale = (sale: Sale) => setSales(prev => [sale, ...prev]);

  const addReservation = (r: Reservation) =>
    setReservations(prev => [r, ...prev]);

  const updateReservationStatus = (
    id: string,
    status: Reservation['status'],
    reassignedTo?: Reservation['reassignedTo']
  ) =>
    setReservations(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status, ...(reassignedTo ? { reassignedTo } : {}) }
          : r
      )
    );

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        routes,
        setRoutes,
        sales,
        addSale,
        reservations,
        addReservation,
        updateReservationStatus,
        currentView,
        setCurrentView,
        isOnline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
