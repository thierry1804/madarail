import { useApp } from './contexts/AppContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Products } from './pages/Products';
import { Sales } from './pages/Sales';
import { Users } from './pages/Users';

function App() {
  const { currentView, currentUser } = useApp();

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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{renderView()}</div>
      </main>
    </div>
  );
}

export default App;
