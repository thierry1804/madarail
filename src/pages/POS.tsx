import { useState, useEffect } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  Banknote,
  Smartphone,
  Ticket,
  Train,
  Clock,
  User,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TicketItem, Sale } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { mockRoutes } from '../utils/mockData';

function formatAriary(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' Ar';
}

export function POS() {
  const { currentUser, addSale, setRoutes, routes } = useApp();
  const [cart, setCart] = useState<TicketItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [pendingRouteId, setPendingRouteId] = useState<string | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [travelDate, setTravelDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (routes.length === 0) {
      setRoutes(mockRoutes);
    }
  }, [routes, setRoutes]);

  const categories = Array.from(new Set(routes.map(r => r.category)));

  const filteredRoutes = routes.filter(route => {
    const matchesSearch =
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.departure.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.arrival.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.trainNumber.includes(searchTerm);
    const matchesCategory = !selectedCategory || route.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRouteSelect = (routeId: string) => {
    setPendingRouteId(routeId);
    setPassengerName('');
    setShowPassengerModal(true);
  };

  const addToCart = () => {
    if (!pendingRouteId || !passengerName.trim()) return;
    const route = routes.find(r => r.id === pendingRouteId);
    if (!route) return;

    setCart([
      ...cart,
      {
        route,
        quantity: 1,
        passengerName: passengerName.trim(),
        travelDate,
      },
    ]);
    setShowPassengerModal(false);
    setPendingRouteId(null);
    setPassengerName('');
  };

  const updateQuantity = (index: number, change: number) => {
    setCart(
      cart
        .map((item, i) =>
          i === index ? { ...item, quantity: item.quantity + change } : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.route.price * item.quantity,
      0
    );
    const tax = subtotal * 0.2;
    return { subtotal, tax, total: subtotal + tax };
  };

  const handlePayment = (method: 'cash' | 'card' | 'mobile_money') => {
    if (cart.length === 0) return;

    const { subtotal, tax, total } = calculateTotal();
    const sale: Sale = {
      id: `BIL-${Date.now()}`,
      items: cart,
      subtotal,
      tax,
      total,
      paymentMethod: method,
      agentId: currentUser!.id,
      agentName: currentUser!.name,
      gareId: currentUser!.gareId || 'GARE-TANA-001',
      createdAt: new Date().toISOString(),
    };

    addSale(sale);
    setCart([]);
    setShowPaymentModal(false);
  };

  const { subtotal, tax, total } = calculateTotal();

  const getClasseColor = (classe: string) => {
    switch (classe) {
      case '1ère classe':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case '2ème classe':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case '3ème classe':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <Input
            placeholder="Rechercher par trajet, gare ou n° de train..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="text-lg"
          />
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tous
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredRoutes.map(route => (
              <button
                key={route.id}
                onClick={() => handleRouteSelect(route.id)}
                className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-emerald-500 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Train className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-mono text-gray-500">
                      {route.trainNumber}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border ${getClasseColor(route.classe)}`}
                  >
                    {route.classe}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="text-left">
                    <p className="font-bold text-gray-900">{route.departure}</p>
                    <p className="text-sm text-gray-500">{route.departureTime}</p>
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="h-px flex-1 bg-emerald-300" />
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">
                      {route.duration}
                    </span>
                    <div className="h-px flex-1 bg-emerald-300" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{route.arrival}</p>
                    <p className="text-sm text-gray-500">{route.arrivalTime}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-emerald-700 font-bold text-lg">
                    {formatAriary(route.price)}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      route.seatsAvailable < 10
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {route.seatsAvailable} places
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-96 flex flex-col bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Ticket className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold">Billets</h2>
          </div>
          <p className="text-sm text-gray-500">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} billet(s)
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Ticket className="w-16 h-16 mb-4" />
              <p>Aucun billet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {item.route.departure} → {item.route.arrival}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {item.route.classe} - {item.route.trainNumber}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-gray-600 mb-2 space-y-1">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{item.passengerName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(item.travelDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="p-1.5 hover:bg-gray-100 rounded-l-lg"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="p-1.5 hover:bg-gray-100 rounded-r-lg"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-sm">
                      {formatAriary(item.route.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Sous-total</span>
              <span>{formatAriary(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm">
              <span>TVA (20%)</span>
              <span>{formatAriary(tax)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-300">
              <span>Total</span>
              <span className="text-emerald-600">{formatAriary(total)}</span>
            </div>
          </div>

          <Button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="w-full !bg-emerald-600 hover:!bg-emerald-700"
            size="lg"
          >
            Encaisser
          </Button>
        </div>
      </div>

      {/* Modal passager */}
      {showPassengerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Informations du passager</h3>
            <div className="space-y-4">
              <Input
                label="Nom du passager"
                placeholder="Nom complet du passager"
                value={passengerName}
                onChange={e => setPassengerName(e.target.value)}
                required
              />
              <Input
                label="Date de voyage"
                type="date"
                value={travelDate}
                onChange={e => setTravelDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />

              {pendingRouteId && (
                <div className="bg-emerald-50 rounded-lg p-4">
                  {(() => {
                    const route = routes.find(r => r.id === pendingRouteId);
                    if (!route) return null;
                    return (
                      <div>
                        <p className="font-semibold text-emerald-900">
                          {route.departure} → {route.arrival}
                        </p>
                        <p className="text-sm text-emerald-700">
                          {route.classe} - Train {route.trainNumber}
                        </p>
                        <p className="text-sm text-emerald-700">
                          D&eacute;part: {route.departureTime} - Arriv&eacute;e:{' '}
                          {route.arrivalTime}
                        </p>
                        <p className="font-bold text-emerald-800 mt-1">
                          {formatAriary(route.price)}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={addToCart}
                  disabled={!passengerName.trim()}
                  className="flex-1 !bg-emerald-600 hover:!bg-emerald-700"
                >
                  Ajouter au panier
                </Button>
                <Button
                  onClick={() => {
                    setShowPassengerModal(false);
                    setPendingRouteId(null);
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal paiement */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6">Mode de paiement</h3>
            <div className="space-y-3">
              <button
                onClick={() => handlePayment('cash')}
                className="w-full flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 border-2 border-green-500 rounded-lg transition-all"
              >
                <Banknote className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="font-bold text-lg">Esp&egrave;ces</p>
                  <p className="text-sm text-gray-600">Paiement en liquide (Ariary)</p>
                </div>
              </button>

              <button
                onClick={() => handlePayment('card')}
                className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-500 rounded-lg transition-all"
              >
                <CreditCard className="w-8 h-8 text-blue-600" />
                <div className="text-left">
                  <p className="font-bold text-lg">Carte bancaire</p>
                  <p className="text-sm text-gray-600">Visa, Mastercard</p>
                </div>
              </button>

              <button
                onClick={() => handlePayment('mobile_money')}
                className="w-full flex items-center gap-4 p-4 bg-orange-50 hover:bg-orange-100 border-2 border-orange-500 rounded-lg transition-all"
              >
                <Smartphone className="w-8 h-8 text-orange-600" />
                <div className="text-left">
                  <p className="font-bold text-lg">Mobile Money</p>
                  <p className="text-sm text-gray-600">MVola, Orange Money, Airtel Money</p>
                </div>
              </button>
            </div>

            <Button
              onClick={() => setShowPaymentModal(false)}
              variant="secondary"
              className="w-full mt-4"
            >
              Annuler
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
