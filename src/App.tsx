import { useState, useEffect, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { useApp } from './contexts/AppContext';
import {
  Sidebar,
  loadSidebarCollapsedPreference,
  saveSidebarCollapsedPreference,
} from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Products } from './pages/Products';
import { Sales } from './pages/Sales';
import { Users } from './pages/Users';

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

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS />;
      case 'routes':
        return <Products />;
      case 'sales':
        return <Sales />;
      case 'users':
        return <Users />;
      default:
        return <Dashboard />;
    }
  };

  const isPos = currentView === 'pos';

  return (
    <div className="relative flex h-screen w-full flex-col bg-madarail-rail">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Fermer le menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-madarail-navy-bright bg-madarail-navy px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="rounded-lg p-2 text-white hover:bg-madarail-navy-bright"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="truncate text-sm font-semibold text-white">Madarail</span>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleCollapsed}
          mobileOpen={mobileNavOpen}
          onMobileOpenChange={setMobileNavOpen}
        />
        <main
          className={`min-h-0 flex-1 ${
            isPos ? 'overflow-hidden' : 'overflow-auto p-4 md:p-8'
          }`}
        >
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
