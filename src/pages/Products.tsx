import { useState } from 'react';
import { Plus, CreditCard as Edit, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { TrainRoute } from '../types';

function formatAriary(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' Ar';
}

export function Products() {
  const { routes, setRoutes, currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TrainRoute | null>(null);
  const [formData, setFormData] = useState({
    departure: '',
    arrival: '',
    category: '',
    classe: '2ème classe' as TrainRoute['classe'],
    price: '',
    seatsAvailable: '',
    trainNumber: '',
    departureTime: '',
    arrivalTime: '',
    duration: '',
    serviceName: '',
    operatingDays: '',
  });

  const filteredRoutes = routes.filter(
    route =>
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.departure.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.arrival.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRoute) {
      setRoutes(
        routes.map(r =>
          r.id === editingRoute.id
            ? {
                ...r,
                name: `${formData.departure} - ${formData.arrival}`,
                departure: formData.departure,
                arrival: formData.arrival,
                category: formData.category,
                classe: formData.classe,
                price: parseFloat(formData.price),
                seatsAvailable: parseInt(formData.seatsAvailable),
                trainNumber: formData.trainNumber,
                departureTime: formData.departureTime,
                arrivalTime: formData.arrivalTime,
                duration: formData.duration,
                serviceName: formData.serviceName.trim() || undefined,
                operatingDays: formData.operatingDays.trim() || undefined,
              }
            : r
        )
      );
    } else {
      const newRoute: TrainRoute = {
        id: Date.now().toString(),
        name: `${formData.departure} - ${formData.arrival}`,
        departure: formData.departure,
        arrival: formData.arrival,
        category: formData.category,
        classe: formData.classe,
        price: parseFloat(formData.price),
        seatsAvailable: parseInt(formData.seatsAvailable),
        trainNumber: formData.trainNumber,
        departureTime: formData.departureTime,
        arrivalTime: formData.arrivalTime,
        duration: formData.duration,
        serviceName: formData.serviceName.trim() || undefined,
        operatingDays: formData.operatingDays.trim() || undefined,
      };
      setRoutes([...routes, newRoute]);
    }

    resetForm();
  };

  const handleEdit = (route: TrainRoute) => {
    setEditingRoute(route);
    setFormData({
      departure: route.departure,
      arrival: route.arrival,
      category: route.category,
      classe: route.classe,
      price: route.price.toString(),
      seatsAvailable: route.seatsAvailable.toString(),
      trainNumber: route.trainNumber,
      departureTime: route.departureTime,
      arrivalTime: route.arrivalTime,
      duration: route.duration,
      serviceName: route.serviceName ?? '',
      operatingDays: route.operatingDays ?? '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce trajet ?')) {
      setRoutes(routes.filter(r => r.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      departure: '',
      arrival: '',
      category: '',
      classe: '2ème classe',
      price: '',
      seatsAvailable: '',
      trainNumber: '',
      departureTime: '',
      arrivalTime: '',
      duration: '',
      serviceName: '',
      operatingDays: '',
    });
    setEditingRoute(null);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? 'Gestion des trajets' : 'Liste des trajets'}
          </h1>
          <p className="text-gray-600 mt-1">
            {routes.length} trajet(s)
            {!isAdmin && (
              <span className="block text-sm text-slate-500 mt-1">
                Consultation seule — la modification est réservée aux administrateurs.
              </span>
            )}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 !bg-madarail-red hover:!bg-madarail-red-dark"
          >
            <Plus className="w-4 h-4" />
            Nouveau trajet
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher un trajet..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Service / train
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trajet
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ligne
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Classe
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Horaires
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Prix
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Places dispo.
                </th>
                {isAdmin && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRoutes.map(route => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-600">
                    <div className="font-medium text-gray-900">
                      {route.serviceName ?? '—'}
                    </div>
                    <div className="font-mono text-xs">{route.trainNumber}</div>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {route.departure} → {route.arrival}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {route.category}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        route.classe === '1ère classe'
                          ? 'bg-amber-100 text-amber-800'
                          : route.classe === '2ème classe'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {route.classe}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {route.departureTime} - {route.arrivalTime} ({route.duration})
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">
                    {formatAriary(route.price)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        route.seatsAvailable <= 0
                          ? 'bg-slate-200 text-slate-700'
                          : route.seatsAvailable < 10
                          ? 'bg-red-100 text-red-800'
                          : route.seatsAvailable < 30
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      <span className="tabular-nums">{route.seatsAvailable}</span>
                      <span className="font-normal opacity-90">places dispo.</span>
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(route)}
                          className="text-blue-600 hover:text-blue-800"
                          aria-label="Modifier"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(route.id)}
                          className="text-red-600 hover:text-red-800"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <h3 className="text-2xl font-bold mb-6">
              {editingRoute ? 'Modifier le trajet' : 'Nouveau trajet'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Gare de d&eacute;part"
                  value={formData.departure}
                  onChange={e =>
                    setFormData({ ...formData, departure: e.target.value })
                  }
                  placeholder="Antananarivo"
                  required
                />
                <Input
                  label="Gare d'arriv&eacute;e"
                  value={formData.arrival}
                  onChange={e =>
                    setFormData({ ...formData, arrival: e.target.value })
                  }
                  placeholder="Antsirabe"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="N° de train"
                  value={formData.trainNumber}
                  onChange={e =>
                    setFormData({ ...formData, trainNumber: e.target.value })
                  }
                  placeholder="TCE-001"
                  required
                />
                <Input
                  label="Ligne (code)"
                  value={formData.category}
                  onChange={e =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="TCE, TA, MOR..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Service (optionnel)"
                  value={formData.serviceName}
                  onChange={e =>
                    setFormData({ ...formData, serviceName: e.target.value })
                  }
                  placeholder="Trans Lémurie Express"
                />
                <Input
                  label="Jours d'exploitation (optionnel)"
                  value={formData.operatingDays}
                  onChange={e =>
                    setFormData({ ...formData, operatingDays: e.target.value })
                  }
                  placeholder="ex. Dimanche, Jeudi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classe
                </label>
                <select
                  value={formData.classe}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      classe: e.target.value as TrainRoute['classe'],
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-madarail-red focus:border-transparent outline-none"
                  required
                >
                  <option value="1ère classe">1&egrave;re classe</option>
                  <option value="2ème classe">2&egrave;me classe</option>
                  <option value="3ème classe">3&egrave;me classe</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Heure d&eacute;part"
                  type="time"
                  value={formData.departureTime}
                  onChange={e =>
                    setFormData({ ...formData, departureTime: e.target.value })
                  }
                  required
                />
                <Input
                  label="Heure arriv&eacute;e"
                  type="time"
                  value={formData.arrivalTime}
                  onChange={e =>
                    setFormData({ ...formData, arrivalTime: e.target.value })
                  }
                  required
                />
                <Input
                  label="Dur&eacute;e"
                  value={formData.duration}
                  onChange={e =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  placeholder="4h"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prix (Ar)"
                  type="number"
                  value={formData.price}
                  onChange={e =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                />
                <Input
                  label="Places disponibles"
                  type="number"
                  value={formData.seatsAvailable}
                  onChange={e =>
                    setFormData({ ...formData, seatsAvailable: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 !bg-madarail-red hover:!bg-madarail-red-dark">
                  {editingRoute ? 'Enregistrer' : 'Cr&eacute;er'}
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
