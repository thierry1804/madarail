import { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { useApp } from './contexts/AppContext';
import {
  Sidebar,
  loadSidebarCollapsedPreference,
  saveSidebarCollapsedPreference,
} from './components/Sidebar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Products } from './pages/Products';
import { Sales } from './pages/Sales';
import { Users } from './pages/Users';
import { Reservation } from './pages/Reservation';
import { Bluetooth } from './pages/Bluetooth';

function App() {
  const { currentView, currentUser } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    loadSidebarCollapsedPreference
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    saveSidebarCollapsedPreference(sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileNavOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setSidebarCollapsed(c => !c);
  }, []);

  if (!currentUser) {
    return <Login />;
  }

  const role = currentUser.role;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        // Only admins see the dashboard
        if (role !== 'admin') return <Sales />;
        return <Dashboard />;

      case 'pos':
        return <POS readOnly={role === 'controller'} />;

      case 'routes':
        return <Products />;

      case 'sales':
        return <Sales />;

      case 'users':
        // Only admins can access user management
        if (role !== 'admin') return <Sales />;
        return <Users />;

      case 'reservation':
        // Agents and admins only
        if (role === 'controller') return <Sales />;
        return <Reservation />;

      case 'bluetooth':
        // Agents and controllers only
        return <Bluetooth />;

      default:
        return role === 'admin' ? <Dashboard /> : <Sales />;
    }
  };

  const isPos = currentView === 'pos' || currentView === 'reservation';

  return (
    <div className="relative flex h-[100dvh] min-h-0 w-full max-w-[100vw] flex-col overflow-x-hidden bg-madarail-rail">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Fermer le menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <header className="flex min-h-[calc(3.5rem+env(safe-area-inset-top,0px))] shrink-0 items-center gap-3 border-b border-madarail-navy-bright bg-madarail-navy px-3 pt-[env(safe-area-inset-top,0px)] lg:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="rounded-lg p-2 text-white hover:bg-madarail-navy-bright"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="truncate text-sm font-semibold text-white">Madarail</span>
        <div className="ml-auto">
          <OfflineIndicator compact />
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleCollapsed}
          mobileOpen={mobileNavOpen}
          onMobileOpenChange={setMobileNavOpen}
        />
        <main
          className={`min-h-0 min-w-0 flex-1 ${
            isPos ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-8'
          }`}
        >
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
