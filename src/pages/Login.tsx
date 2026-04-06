import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { MadarailLogo } from '../components/MadarailLogo';
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
    <div className="min-h-screen bg-gradient-to-br from-madarail-navy via-madarail-navy-mid to-[#061525] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 px-4 py-2">
            <MadarailLogo className="h-12 w-auto max-w-[280px]" />
          </div>
          <p className="text-slate-400 text-sm">
            Syst&egrave;me de vente de billets
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200/80">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Email"
              type="email"
              placeholder="exemple@madarail.mg"
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

            <Button
              type="submit"
              className="w-full !bg-madarail-red hover:!bg-madarail-red-dark"
              size="lg"
            >
              Se connecter
            </Button>
          </form>

          <div className="mt-6 p-4 bg-madarail-rail rounded-lg border border-slate-200">
            <p className="text-sm text-madarail-navy font-medium mb-2">D&eacute;mo:</p>
            <p className="text-xs text-slate-600">
              Admin: admin@madarail.mg
              <br />
              Agent: agent@madarail.mg
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          <a
            href="http://www.madarail.mg/a_propos.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white underline underline-offset-2"
          >
            madarail.mg
          </a>
        </p>
      </div>
    </div>
  );
}
