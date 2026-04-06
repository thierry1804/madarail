import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User, TrainRoute, Sale } from '../types';

/** v3 : places par trajet (id), plus de stock partagé par numéro de train */
const ROUTES_STORAGE_KEY = 'madarail-routes-v3';

function loadRoutesFromStorage(): TrainRoute[] {
  try {
    const raw = localStorage.getItem(ROUTES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TrainRoute[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  routes: TrainRoute[];
  setRoutes: (routes: TrainRoute[]) => void;
  sales: Sale[];
  addSale: (sale: Sale) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [routes, setRoutes] = useState<TrainRoute[]>(loadRoutesFromStorage);
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentView, setCurrentView] = useState('login');

  useEffect(() => {
    if (routes.length > 0) {
      try {
        localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(routes));
      } catch {
        /* quota / private mode */
      }
    }
  }, [routes]);

  const addSale = (sale: Sale) => {
    setSales(prev => [sale, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        routes,
        setRoutes,
        sales,
        addSale,
        currentView,
        setCurrentView,
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
