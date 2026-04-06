import {
  LayoutDashboard,
  Ticket,
  Train,
  History,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { MadarailLogo } from './MadarailLogo';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, adminOnly: true },
  { id: 'pos', label: 'Vente de billets', icon: Ticket },
  { id: 'routes', label: 'Trajets', icon: Train },
  { id: 'sales', label: 'Historique', icon: History },
  { id: 'users', label: 'Utilisateurs', icon: Users, adminOnly: true },
];

const STORAGE_COLLAPSED = 'madarail-sidebar-collapsed';

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onMobileOpenChange,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const { currentView, setCurrentView, currentUser, setCurrentUser } = useApp();

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  const filteredMenuItems = menuItems.filter(
    item => !item.adminOnly || currentUser?.role === 'admin'
  );

  const navigate = (id: string) => {
    setCurrentView(id);
    onMobileOpenChange(false);
  };

  return (
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-madarail-navy text-white shadow-xl
          transition-[width,transform] duration-200 ease-out
          w-[min(18rem,85vw)]
          lg:static lg:shadow-none lg:shrink-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
        aria-label="Navigation principale"
      >
        <button
          type="button"
          onClick={() => onMobileOpenChange(false)}
          className="lg:hidden absolute top-3 right-3 z-10 p-2 rounded-lg bg-madarail-navy-bright/80 text-white hover:bg-madarail-navy-mid"
          aria-label="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className={`p-4 border-b border-madarail-navy-bright ${collapsed ? 'lg:p-3' : ''}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div
              className={`bg-white/95 rounded-lg shadow-sm min-w-0 flex-1 ${
                collapsed ? 'lg:p-2 lg:flex lg:justify-center' : 'px-3 py-2.5'
              }`}
            >
              <MadarailLogo
                className={`h-8 w-full max-w-[200px] mx-auto ${
                  collapsed ? 'lg:h-7 lg:max-w-[2.5rem] lg:object-left' : ''
                }`}
              />
            </div>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="hidden lg:flex shrink-0 items-center justify-center w-8 h-8 rounded-lg bg-madarail-navy-bright hover:bg-madarail-navy-mid text-slate-300 transition-colors"
              title={collapsed ? 'Développer le menu' : 'Réduire le menu'}
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>
          <p
            className={`text-[11px] text-slate-400 mt-3 uppercase tracking-wide ${
              collapsed ? 'lg:hidden' : ''
            }`}
          >
            Madagascar
          </p>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {filteredMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 py-3 transition-colors ${
                  collapsed ? 'lg:justify-center lg:px-2 lg:gap-0' : 'px-6'
                } ${
                  isActive
                    ? 'bg-madarail-red text-white shadow-inner'
                    : 'text-slate-200 hover:bg-madarail-navy-bright hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span
                  className={`font-medium text-left ${collapsed ? 'lg:hidden' : ''}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div
          className={`p-4 border-t border-madarail-navy-bright ${
            collapsed ? 'lg:p-3' : 'lg:p-6'
          }`}
        >
          <div className={`mb-4 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="text-sm text-slate-400">Connect&eacute; en tant que</p>
            <p className="font-medium truncate">{currentUser?.name}</p>
            <p className="text-xs text-slate-500 truncate">{currentUser?.gareId}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? 'Déconnexion' : undefined}
            className={`w-full flex items-center gap-3 py-2.5 bg-madarail-navy-bright hover:bg-madarail-navy-mid rounded-lg transition-colors ${
              collapsed ? 'lg:justify-center lg:px-2' : 'px-4'
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>D&eacute;connexion</span>
          </button>
        </div>
      </aside>
  );
}

export function loadSidebarCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_COLLAPSED) === '1';
  } catch {
    return false;
  }
}

export function saveSidebarCollapsedPreference(collapsed: boolean): void {
  try {
    localStorage.setItem(STORAGE_COLLAPSED, collapsed ? '1' : '0');
  } catch {
    /* ignore */
  }
}
