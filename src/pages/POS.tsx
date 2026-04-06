import { useState, useEffect, useMemo } from 'react';
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
  Search,
  MapPin,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TicketItem, Sale, TrainRoute } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { mockRoutes } from '../utils/mockData';

function formatAriary(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' Ar';
}

const LINE_FILTERS: { id: string; label: string }[] = [
  { id: '', label: 'Toutes lignes' },
  { id: 'TCE', label: 'Tana – Côte Est' },
  { id: 'TA', label: 'Tana – Antsirabe' },
  { id: 'MOR', label: 'Moramanga – Ambila' },
];

function RouteSaleCard({
  route,
  canSelect,
  getClasseColor,
  lineLabel,
  onSelect,
}: {
  route: TrainRoute;
  canSelect: boolean;
  getClasseColor: (classe: string) => string;
  lineLabel: (code: string) => string;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={!canSelect}
      onClick={() => canSelect && onSelect(route.id)}
      className={`group rounded-2xl p-5 border-2 text-left min-h-[180px] flex flex-col transition-all shadow-sm ${
        canSelect
          ? 'bg-white border-madarail-red hover:border-madarail-red-dark hover:shadow-md cursor-pointer'
          : 'bg-slate-100 border-slate-300 text-slate-500 opacity-80 grayscale cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-bold uppercase tracking-wide leading-tight truncate ${
              canSelect ? 'text-madarail-navy' : 'text-slate-500'
            }`}
          >
            {route.serviceName ?? 'Trajet'}
          </p>
          <p className="text-xs text-slate-400 font-mono mt-1 tabular-nums">
            {route.trainNumber}
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${getClasseColor(route.classe)}`}
        >
          {route.classe}
        </span>
      </div>

      <div className="flex items-start gap-3 mb-3 flex-1">
        <Train
          className={`w-6 h-6 shrink-0 mt-0.5 ${canSelect ? 'text-madarail-red' : 'text-slate-400'}`}
        />
        <div className="min-w-0">
          <p
            className={`text-lg font-bold leading-tight ${canSelect ? 'text-slate-900' : 'text-slate-600'}`}
          >
            {route.departure}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">
            <span className="text-slate-400" aria-hidden="true">
              →{' '}
            </span>
            {route.arrival}
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2 text-xs text-slate-500 mb-2">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span>
            {route.departureTime} – {route.arrivalTime} · {route.duration}
          </span>
        </span>
        <span className="font-medium text-slate-500 text-right shrink-0 max-w-[50%]">
          {lineLabel(route.category)}
        </span>
      </div>

      {route.operatingDays && (
        <p className="text-xs text-amber-900 bg-amber-50 rounded-lg px-2 py-1.5 mb-2 border border-amber-100">
          {route.operatingDays}
        </p>
      )}

      <div className="flex items-end justify-between mt-auto pt-3 border-t border-slate-200">
        <span
          className={`text-2xl font-bold tabular-nums tracking-tight ${
            canSelect ? 'text-madarail-red' : 'text-slate-500'
          }`}
        >
          {formatAriary(route.price)}
        </span>
        <span
          className={`text-sm font-semibold tabular-nums ${
            canSelect
              ? route.seatsAvailable < 10
                ? 'text-red-600'
                : 'text-madarail-red'
              : 'text-slate-500'
          }`}
        >
          {route.seatsAvailable} pl. dispo.
        </span>
      </div>
    </button>
  );
}

export function POS() {
  const { currentUser, addSale, setRoutes, routes } = useApp();
  const [cart, setCart] = useState<TicketItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [now, setNow] = useState(() => new Date());
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

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const services = useMemo(() => {
    const names = new Set<string>();
    routes.forEach(r => {
      if (r.serviceName) names.add(r.serviceName);
    });
    return Array.from(names).sort();
  }, [routes]);

  const filteredRoutes = routes.filter(route => {
    const matchesSearch =
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.departure.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.arrival.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.trainNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (route.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false);
    const matchesService =
      !selectedService || route.serviceName === selectedService;
    const matchesLine = !selectedLine || route.category === selectedLine;
    return matchesSearch && matchesService && matchesLine;
  });

  const routesWithSeats = useMemo(
    () => filteredRoutes.filter(r => r.seatsAvailable > 0),
    [filteredRoutes]
  );
  const routesSoldOut = useMemo(
    () => filteredRoutes.filter(r => r.seatsAvailable <= 0),
    [filteredRoutes]
  );

  const handleRouteSelect = (routeId: string) => {
    setPendingRouteId(routeId);
    setPassengerName('');
    setShowPassengerModal(true);
  };

  const addToCart = () => {
    if (!pendingRouteId || !passengerName.trim()) return;
    const route = routes.find(r => r.id === pendingRouteId);
    if (!route) return;

    const live = routes.find(r => r.id === route.id) ?? route;
    const qtyAlready = cart
      .filter(i => i.route.id === live.id)
      .reduce((s, i) => s + i.quantity, 0);
    if (qtyAlready + 1 > live.seatsAvailable) {
      window.alert('Plus de places disponibles pour ce trajet.');
      return;
    }

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
    const item = cart[index];
    if (!item) return;
    const newQty = item.quantity + change;
    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== index));
      return;
    }

    if (change > 0) {
      const routeId = item.route.id;
      const live = routes.find(r => r.id === routeId);
      if (!live) return;
      const qtySameRouteElsewhere = cart.reduce((sum, line, i) => {
        if (i === index) return sum;
        return line.route.id === routeId ? sum + line.quantity : sum;
      }, 0);
      if (qtySameRouteElsewhere + newQty > live.seatsAvailable) {
        window.alert('Nombre de places insuffisant pour ce trajet.');
        return;
      }
    }

    setCart(
      cart.map((line, i) =>
        i === index ? { ...line, quantity: newQty } : line
      )
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

    const seatsByRouteId = new Map<string, number>();
    for (const item of cart) {
      const id = item.route.id;
      seatsByRouteId.set(id, (seatsByRouteId.get(id) ?? 0) + item.quantity);
    }

    for (const [routeId, qty] of seatsByRouteId) {
      const r = routes.find(x => x.id === routeId);
      if (!r || r.seatsAvailable < qty) {
        window.alert(
          'Pas assez de places disponibles pour un ou plusieurs trajets du panier. Videz le panier et réessayez.'
        );
        return;
      }
    }

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

    setRoutes(prev =>
      prev.map(r => {
        const sold = seatsByRouteId.get(r.id);
        if (!sold) return r;
        return {
          ...r,
          seatsAvailable: Math.max(0, r.seatsAvailable - sold),
        };
      })
    );

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

  const lineLabel = (code: string) => {
    const f = LINE_FILTERS.find(l => l.id === code);
    return f?.label ?? code;
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-madarail-navy">
      {/* Barre caisse type POS */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#061525] text-white border-b border-madarail-navy-bright">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="rounded-lg bg-madarail-red p-2">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-tight">
                Caisse billets
              </h1>
              <p className="text-xs text-slate-400">Madarail · Guichet</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-300 border-l border-slate-700 pl-4">
            <MapPin className="w-4 h-4 text-madarail-red-muted shrink-0" />
            <span className="truncate">{currentUser?.gareId ?? 'Gare'}</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 font-mono tabular-nums">
            <Clock className="w-4 h-4 text-madarail-red-muted" />
            <span>
              {now.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="text-slate-500 hidden md:inline">
              {now.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs text-slate-500">Agent</p>
            <p className="font-medium truncate max-w-[160px]">
              {currentUser?.name}
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Zone catalogue trajets */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-slate-100 xl:min-h-0 min-h-[45vh]">
          <div className="shrink-0 p-3 space-y-3 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="search"
                placeholder="Rechercher gare, train, service…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-base
                  focus:border-madarail-red focus:ring-2 focus:ring-madarail-red/25 outline-none transition-shadow"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-full sm:w-auto sm:mr-2 py-1">
                Service
              </span>
              <button
                type="button"
                onClick={() => setSelectedService('')}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
                  !selectedService
                    ? 'bg-madarail-red text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tous
              </button>
              {services.map(svc => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => setSelectedService(svc)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors min-h-[44px] max-w-[280px] ${
                    selectedService === svc
                      ? 'bg-madarail-red text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {svc}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-full sm:w-auto sm:mr-2 py-1">
                Ligne
              </span>
              {LINE_FILTERS.map(line => (
                <button
                  key={line.id || 'all'}
                  type="button"
                  onClick={() => setSelectedLine(line.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                    selectedLine === line.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-madarail-red'
                  }`}
                >
                  {line.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {routesWithSeats.map(route => (
                <RouteSaleCard
                  key={route.id}
                  route={route}
                  canSelect
                  getClasseColor={getClasseColor}
                  lineLabel={lineLabel}
                  onSelect={handleRouteSelect}
                />
              ))}
              {routesSoldOut.length > 0 && (
                <div className="col-span-full flex flex-col gap-2 pt-4 mt-2 border-t border-slate-300">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Complet — sans places disponibles
                  </p>
                </div>
              )}
              {routesSoldOut.map(route => (
                <RouteSaleCard
                  key={route.id}
                  route={route}
                  canSelect={false}
                  getClasseColor={getClasseColor}
                  lineLabel={lineLabel}
                  onSelect={handleRouteSelect}
                />
              ))}
            </div>
            {filteredRoutes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Train className="w-16 h-16 mb-4 opacity-40" />
                <p className="font-medium">Aucun trajet pour ces filtres</p>
                <p className="text-sm">Modifiez la recherche ou le service.</p>
              </div>
            )}
          </div>
        </div>

        {/* Panneau panier type caisse */}
        <aside className="w-full xl:max-w-md xl:w-[420px] shrink-0 flex flex-col bg-white border-t xl:border-t-0 xl:border-l border-slate-200 shadow-xl min-h-[40vh] xl:min-h-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 mb-1">
              <Ticket className="w-6 h-6 text-madarail-red" />
              <h2 className="text-xl font-bold text-slate-900">Panier</h2>
            </div>
            <p className="text-sm text-slate-600">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} billet(s)
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400">
                <Ticket className="w-14 h-14 mb-3 opacity-50" />
                <p className="font-medium text-slate-500">Panier vide</p>
                <p className="text-sm text-center px-4">
                  Sélectionnez un trajet à gauche pour commencer la vente.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-madarail-navy truncate">
                          {item.route.serviceName ?? 'Trajet'}
                        </p>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">
                          {item.route.departure} → {item.route.arrival}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.route.trainNumber} · {item.route.classe}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        aria-label="Retirer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-600 mb-3 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.passengerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {new Date(item.travelDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-white rounded-lg border-2 border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, -1)}
                          className="p-2.5 hover:bg-slate-100 rounded-l-md"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-bold text-base">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, 1)}
                          className="p-2.5 hover:bg-slate-100 rounded-r-md"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-bold text-base tabular-nums">
                        {formatAriary(item.route.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t-2 border-slate-200 bg-slate-50 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total</span>
                <span className="tabular-nums">{formatAriary(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>TVA (20 %)</span>
                <span className="tabular-nums">{formatAriary(tax)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-2 border-t border-slate-300 text-slate-900">
                <span>À payer</span>
                <span className="text-madarail-red tabular-nums">
                  {formatAriary(total)}
                </span>
              </div>
            </div>

            <Button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0}
              className="w-full !bg-madarail-red hover:!bg-madarail-red-dark !py-4 text-lg font-bold shadow-lg"
              size="lg"
            >
              Encaisser
            </Button>
          </div>
        </aside>
      </div>

      {showPassengerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Passager</h3>
            <div className="space-y-4">
              <Input
                label="Nom du passager"
                placeholder="Nom complet"
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
                <div className="bg-madarail-red-soft rounded-xl p-4 border border-madarail-red-muted">
                  {(() => {
                    const route = routes.find(r => r.id === pendingRouteId);
                    if (!route) return null;
                    return (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-madarail-navy uppercase">
                          {route.serviceName}
                        </p>
                        <p className="font-bold text-madarail-navy">
                          {route.departure} → {route.arrival}
                        </p>
                        <p className="text-sm text-madarail-navy-mid">
                          {route.trainNumber} · {route.classe}
                        </p>
                        <p className="text-sm text-madarail-navy-mid">
                          Départ {route.departureTime} · Arrivée{' '}
                          {route.arrivalTime} ({route.duration})
                        </p>
                        {route.operatingDays && (
                          <p className="text-sm text-amber-900 bg-amber-100 rounded-lg px-2 py-1 mt-2">
                            Jours : {route.operatingDays}
                          </p>
                        )}
                        <p className="font-bold text-lg text-madarail-red mt-2">
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
                  className="flex-1 !bg-madarail-red hover:!bg-madarail-red-dark"
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

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6">Paiement</h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handlePayment('cash')}
                className="w-full flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 border-2 border-green-500 rounded-xl transition-all min-h-[56px]"
              >
                <Banknote className="w-8 h-8 text-green-600 shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-lg">Espèces</p>
                  <p className="text-sm text-gray-600">Ariary</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePayment('card')}
                className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-500 rounded-xl transition-all min-h-[56px]"
              >
                <CreditCard className="w-8 h-8 text-blue-600 shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-lg">Carte bancaire</p>
                  <p className="text-sm text-gray-600">Visa, Mastercard</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePayment('mobile_money')}
                className="w-full flex items-center gap-4 p-4 bg-orange-50 hover:bg-orange-100 border-2 border-orange-500 rounded-xl transition-all min-h-[56px]"
              >
                <Smartphone className="w-8 h-8 text-orange-600 shrink-0" />
                <div className="text-left">
                  <p className="font-bold text-lg">Mobile Money</p>
                  <p className="text-sm text-gray-600">
                    MVola, Orange Money, Airtel Money
                  </p>
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
