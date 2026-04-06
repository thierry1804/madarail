import { useState } from 'react';
import { Train } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { User } from '../types';

export function Login() {
  const { setCurrentUser, setCurrentView } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const mockUser: User = {
      id: '1',
      email,
      name: email.split('@')[0],
      role: email.includes('admin') ? 'admin' : 'agent',
      gareId: 'GARE-TANA-001',
      createdAt: new Date().toISOString(),
    };

    setCurrentUser(mockUser);
    setCurrentView(mockUser.role === 'admin' ? 'dashboard' : 'pos');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-full mb-4">
            <Train className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">MaraRail Madagascar</h1>
          <p className="text-emerald-300">Syst&egrave;me de vente de billets</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Email"
              type="email"
              placeholder="exemple@mararail.mg"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full !bg-emerald-600 hover:!bg-emerald-700" size="lg">
              Se connecter
            </Button>
          </form>

          <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
            <p className="text-sm text-emerald-800 font-medium mb-2">D&eacute;mo:</p>
            <p className="text-xs text-emerald-600">
              Admin: admin@mararail.mg<br />
              Agent: agent@mararail.mg
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
