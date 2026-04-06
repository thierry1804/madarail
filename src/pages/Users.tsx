import { useState } from 'react';
import { Plus, CreditCard as Edit, Trash2, CircleUser as UserCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { User } from '../types';

export function Users() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'admin@mararail.mg',
      name: 'Admin Principal',
      role: 'admin',
      gareId: 'GARE-TANA-001',
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      email: 'agent@mararail.mg',
      name: 'Agent Tana 1',
      role: 'agent',
      gareId: 'GARE-TANA-001',
      createdAt: '2024-01-15',
    },
    {
      id: '3',
      email: 'agent.fianar@mararail.mg',
      name: 'Agent Fianarantsoa',
      role: 'agent',
      gareId: 'GARE-FIANAR-001',
      createdAt: '2024-02-01',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'agent' as 'admin' | 'agent',
    gareId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      setUsers(
        users.map(u =>
          u.id === editingUser.id
            ? {
                ...u,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                gareId: formData.gareId,
              }
            : u
        )
      );
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        gareId: formData.gareId,
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
      gareId: user.gareId || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cet utilisateur ?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'agent',
      gareId: '',
    });
    setEditingUser(null);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600 mt-1">{users.length} utilisateur(s)</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 !bg-madarail-red hover:!bg-madarail-red-dark"
        >
          <Plus className="w-4 h-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-madarail-red-soft p-3 rounded-full">
              <UserCircle className="w-6 h-6 text-madarail-red" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <UserCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Administrateurs</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <UserCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Agents de guichet</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'agent').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nom
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  R&ocirc;le
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Gare
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date de cr&eacute;ation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-madarail-red-soft text-madarail-navy'
                      }`}
                    >
                      {user.role === 'admin' ? 'Administrateur' : 'Agent'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {user.gareId || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
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
              {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  R&ocirc;le
                </label>
                <select
                  value={formData.role}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      role: e.target.value as 'admin' | 'agent',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-madarail-red focus:border-transparent outline-none"
                  required
                >
                  <option value="agent">Agent de guichet</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <Input
                label="Gare"
                value={formData.gareId}
                onChange={e => setFormData({ ...formData, gareId: e.target.value })}
                placeholder="GARE-TANA-001"
                required
              />

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 !bg-madarail-red hover:!bg-madarail-red-dark">
                  {editingUser ? 'Enregistrer' : 'Cr&eacute;er'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                  className="flex-1"
                >
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
