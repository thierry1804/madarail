import { useState } from 'react';
import { Plus, Edit2, Trash2, CircleUser as UserCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { User } from '../types';
import { DEPARTURE_CITIES } from '../utils/mockData';

const ROLE_LABELS: Record<User['role'], string> = {
  admin:      'Administrateur',
  agent:      'Agent de guichet',
  controller: 'Contrôleur',
};

const ROLE_BADGE: Record<User['role'], string> = {
  admin:      'bg-blue-100 text-blue-800',
  agent:      'bg-madarail-red-soft text-madarail-navy',
  controller: 'bg-amber-100 text-amber-800',
};

export function Users() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'admin@madarail.mg',
      name: 'Admin Principal',
      role: 'admin',
      gare: 'Antananarivo',
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      email: 'agent@madarail.mg',
      name: 'Agent Tana 1',
      role: 'agent',
      gare: 'Antananarivo',
      createdAt: '2024-01-15',
    },
    {
      id: '3',
      email: 'agent.mor@madarail.mg',
      name: 'Agent Moramanga',
      role: 'agent',
      gare: 'Moramanga',
      createdAt: '2024-02-01',
    },
    {
      id: '4',
      email: 'controller@madarail.mg',
      name: 'Contrôleur TCE',
      role: 'controller',
      gare: 'Antananarivo',
      createdAt: '2024-03-01',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'agent' as User['role'],
    gare: DEPARTURE_CITIES[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(users.map(u =>
        u.id === editingUser.id
          ? { ...u, name: formData.name, email: formData.email, role: formData.role, gare: formData.gare }
          : u
      ));
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        gare: formData.gare,
        createdAt: new Date().toISOString(),
      };
      setUsers([...users, newUser]);
    }
    resetForm();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      gare: user.gare || DEPARTURE_CITIES[0],
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cet utilisateur ?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', role: 'agent', gare: DEPARTURE_CITIES[0] });
    setEditingUser(null);
    setShowModal(false);
  };

  const admins      = users.filter(u => u.role === 'admin').length;
  const agents      = users.filter(u => u.role === 'agent').length;
  const controllers = users.filter(u => u.role === 'controller').length;

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">{users.length} utilisateur(s)</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 !bg-madarail-red hover:!bg-madarail-red-dark"
        >
          <Plus className="w-4 h-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <UserCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Administrateurs</p>
              <p className="text-2xl font-bold text-gray-900">{admins}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-madarail-red-soft p-3 rounded-full">
              <UserCircle className="w-6 h-6 text-madarail-red" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Agents de guichet</p>
              <p className="text-2xl font-bold text-gray-900">{agents}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <UserCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Contrôleurs</p>
              <p className="text-2xl font-bold text-gray-900">{controllers}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-gray-50">
              <tr>
                {['Nom', 'Email', 'Rôle', 'Gare', 'Date de création', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{user.gare || '—'}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800" aria-label="Modifier">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800" aria-label="Supprimer">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6">
              {editingUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nom complet"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as User['role'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-madarail-red focus:border-transparent outline-none"
                  required
                >
                  <option value="agent">Agent de guichet</option>
                  <option value="controller">Contrôleur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gare / Arrêt</label>
                <select
                  value={formData.gare}
                  onChange={e => setFormData({ ...formData, gare: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-madarail-red focus:border-transparent outline-none"
                  required
                >
                  {DEPARTURE_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 !bg-madarail-red hover:!bg-madarail-red-dark">
                  {editingUser ? 'Enregistrer' : 'Créer'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
