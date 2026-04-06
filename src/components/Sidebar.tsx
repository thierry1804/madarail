import {
  LayoutDashboard,
  Ticket,
  Train,
  History,
  Users,
  LogOut,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

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

export function Sidebar() {
  const { currentView, setCurrentView, currentUser, setCurrentUser } = useApp();

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  const filteredMenuItems = menuItems.filter(
    item => !item.adminOnly || currentUser?.role === 'admin'
  );

  return (
    <div className="w-64 bg-emerald-900 text-white flex flex-col h-screen">
      <div className="p-6 border-b border-emerald-700">
        <div className="flex items-center gap-3">
          <Train className="w-8 h-8 text-emerald-300" />
          <div>
            <h1 className="text-xl font-bold">MaraRail</h1>
            <p className="text-xs text-emerald-400">Madagascar</p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4">
        {filteredMenuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-200 hover:bg-emerald-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-6 border-t border-emerald-700">
        <div className="mb-4">
          <p className="text-sm text-emerald-400">Connect&eacute; en tant que</p>
          <p className="font-medium">{currentUser?.name}</p>
          <p className="text-xs text-emerald-400">{currentUser?.gareId}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>D&eacute;connexion</span>
        </button>
      </div>
    </div>
  );
}
