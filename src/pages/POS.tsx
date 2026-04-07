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
  CreditCard,
  Search,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TicketItem, Sale, TrainRoute } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { mockRoutes } from '../utils/mockData';

function formatAriary(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' Ar';
}

const LINE_FILTERS: { id: string; label: string }[] = [
  { id: '', label: 'Toutes lignes' },
  { id: 'TCE', label: 'Tana ? Côte Est' },
  { id: 'TA', label: 'Tana ? Antsirabe' },
  { id: 'MOR', label: 'Moramanga ? Ambila' },
];

function RouteSaleCard({
  route,
  canSelect,
  lineLabel,
  onSelect,
}: {
  route: TrainRoute;
  canSelect: boolean;
  lineLabel: (code: string) => string;
  onSelect: (id: string) => void;
}) {
  const stockState =
    route.seatsAvailable <= 0
      ? {
          label: 'Complet',
          cls: 'bg-red-100 text-red-700 border-red-200',
          icon: XCircle,
        }
      : route.seatsAvailable < 10
        ? {
            label: 'Stock faible',
            cls: 'bg-amber-100 text-amber-800 border-amber-200',
            icon: AlertTriangle,
          }
        : {
            label: 'Disponible',
            cls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            icon: CheckCircle2,
          };

  const StockIcon = stockState.icon;

  return (
    <button
      type="button"
      disabled={!canSelect}
      onClick={() => canSelect && onSelect(route.id)}
      className={`rounded-2xl p-4 border-2 text-left min-h-[155px] flex flex-col transition-all ${
        canSelect
          ? 'bg-white border-slate-200 hover:border-madarail-red hover:shadow-md cursor-pointer'
          : 'bg-slate-100 border-slate-300 text-slate-500 opacity-70 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-madarail-navy truncate">
            {route.serviceName ?? 'Trajet'}
          </p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{route.trainNumber}</p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full border bg-blue-100 text-blue-700 border-blue-200">
          {route.classe}
        </span>
      </div>

      <div className="mt-2">
        <p className="text-lg font-bold text-slate-900 leading-tight">{route.departure}</p>
        <p className="text-sm text-slate-600">&rarr; {route.arrival}</p>
      </div>

      <div className="mt-2 text-xs text-slate-500 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {route.departureTime} ? {route.arrivalTime}
        </span>
        <span>{route.duration}</span>
      </div>

      <div className="mt-1 text-xs text-slate-500">{lineLabel(route.category)}</div>

      <div className="mt-auto pt-3 border-t border-slate-200 flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-madarail-red tabular-nums">
          {formatAriary(route.price)}
        </span>
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-semibold ${stockState.cls}`}
          >
            <StockIcon className="w-3.5 h-3.5" />
            {stockState.label}
          </span>
          <p className="text-xs text-slate-600 mt-1 tabular-nums">{route.seatsAvailable} places</p>
        </div>
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
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [now, setNow] = useState(() => new Date());

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
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      route.name.toLowerCase().includes(q) ||
      route.departure.toLowerCase().includes(q) ||
      route.arrival.toLowerCase().includes(q) ||
      route.trainNumber.toLowerCase().includes(q) ||
      (route.serviceName?.toLowerCase().includes(q) ?? false);
    const matchesService = !selectedService || route.serviceName === selectedService;
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

  const selectedRoute = useMemo(
    () => routes.find(r => r.id === selectedRouteId) ?? null,
    [routes, selectedRouteId]
  );

  const addSelectedToCart = () => {
    if (!selectedRoute || !passengerName.trim()) return;

    const qtyAlready = cart
      .filter(i => i.route.id === selectedRoute.id)
      .reduce((s, i) => s + i.quantity, 0);

    if (qtyAlready + 1 > selectedRoute.seatsAvailable) {
      window.alert('Plus de places disponibles pour ce trajet.');
      return;
    }

    setCart(prev => [
      ...prev,
      {
        route: selectedRoute,
        quantity: 1,
        passengerName: passengerName.trim(),
        travelDate,
      },
    ]);

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
      const live = routes.find(r => r.id === item.route.id);
      if (!live) return;

      const qtySameRouteElsewhere = cart.reduce((sum, line, i) => {
        if (i === index) return sum;
        return line.route.id === item.route.id ? sum + line.quantity : sum;
      }, 0);

      if (qtySameRouteElsewhere + newQty > live.seatsAvailable) {
        window.alert('Nombre de places insuffisant pour ce trajet.');
        return;
      }
    }

    setCart(cart.map((line, i) => (i === index ? { ...line, quantity: newQty } : line)));
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.route.price * item.quantity, 0);
    const tax = subtotal * 0.2;
    return { subtotal, tax, total: subtotal + tax };
  };

  const handlePayment = (method: 'cash' | 'card' | 'mobile_money') => {
    if (cart.length === 0) return;

    const seatsByRouteId = new Map<string, number>();
    for (const item of cart) {
      seatsByRouteId.set(item.route.id, (seatsByRouteId.get(item.route.id) ?? 0) + item.quantity);
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
        return { ...r, seatsAvailable: Math.max(0, r.seatsAvailable - sold) };
      })
    );

    setCart([]);
  };

  const { subtotal, tax, total } = calculateTotal();

  const lineLabel = (code: string) => {
    const f = LINE_FILTERS.find(l => l.id === code);
    return f?.label ?? code;
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-madarail-navy">
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#061525] text-white border-b border-madarail-navy-bright">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="rounded-lg bg-madarail-red p-2">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-tight">Caisse billets</h1>
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
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs text-slate-500">Agent</p>
            <p className="font-medium truncate max-w-[160px]">{currentUser?.name}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row flex-1 min-h-0 overflow-hidden pb-20 xl:pb-0">
        <section className="flex-1 basis-[64%] xl:basis-auto flex flex-col min-w-0 min-h-0 bg-slate-100">
          <div className="shrink-0 p-3 space-y-3 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="search"
                placeholder="Rechercher gare, train, service?"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-base focus:border-madarail-red focus:ring-2 focus:ring-madarail-red/25 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-full sm:w-auto sm:mr-2 py-1">
                Service
              </span>
              <button
                type="button"
                onClick={() => setSelectedService('')}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold min-h-[44px] ${
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
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-left min-h-[44px] max-w-[280px] ${
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
                  className={`px-3 py-2 rounded-lg text-sm font-medium min-h-[40px] ${
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
                  lineLabel={lineLabel}
                  onSelect={setSelectedRouteId}
                />
              ))}
              {routesSoldOut.length > 0 && (
                <div className="col-span-full pt-4 mt-2 border-t border-slate-300">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Complet ? sans places disponibles
                  </p>
                </div>
              )}
              {routesSoldOut.map(route => (
                <RouteSaleCard
                  key={route.id}
                  route={route}
                  canSelect={false}
                  lineLabel={lineLabel}
                  onSelect={setSelectedRouteId}
                />
              ))}
            </div>
            {filteredRoutes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Train className="w-16 h-16 mb-4 opacity-40" />
                <p className="font-medium">Aucun trajet pour ces filtres</p>
              </div>
            )}
          </div>
        </section>

        <aside className="w-full basis-[36%] xl:basis-auto xl:max-w-md xl:w-[420px] shrink-0 flex flex-col min-h-0 bg-white border-t xl:border-t-0 xl:border-l border-slate-200 shadow-xl">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 mb-1">
              <Ticket className="w-6 h-6 text-madarail-red" />
              <h2 className="text-xl font-bold text-slate-900">Panier</h2>
            </div>
            <p className="text-sm text-slate-600">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} billet(s)
            </p>
          </div>

          <div className="p-4 border-b border-slate-200 bg-white space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ajout rapide</p>
            {selectedRoute ? (
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <p className="text-xs font-semibold text-madarail-navy uppercase truncate">
                  {selectedRoute.serviceName}
                </p>
                <p className="font-bold text-slate-900 text-sm">
                  {selectedRoute.departure} &rarr; {selectedRoute.arrival}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedRoute.trainNumber} · {selectedRoute.departureTime} · {selectedRoute.seatsAvailable} pl.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sélectionnez un trajet pour saisir le passager.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
              <Input
                label="Nom passager"
                value={passengerName}
                onChange={e => setPassengerName(e.target.value)}
                placeholder="Nom complet"
              />
              <Input
                label="Date voyage"
                type="date"
                value={travelDate}
                onChange={e => setTravelDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <Button
              onClick={addSelectedToCart}
              disabled={!selectedRoute || !passengerName.trim()}
              className="w-full !bg-madarail-red hover:!bg-madarail-red-dark"
            >
              Ajouter au panier
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[160px] text-slate-400">
                <Ticket className="w-12 h-12 mb-3 opacity-50" />
                <p className="font-medium text-slate-500">Panier vide</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">
                          {item.route.departure} &rarr; {item.route.arrival}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.route.trainNumber} · {item.passengerName}
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

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-white rounded-lg border-2 border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, -1)}
                          className="p-2.5 hover:bg-slate-100 rounded-l-md"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-bold text-base">{item.quantity}</span>
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

          <div className="sticky bottom-0 p-4 border-t-2 border-slate-200 bg-white/95 backdrop-blur space-y-3">
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
                <span className="text-madarail-red tabular-nums">{formatAriary(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handlePayment('cash')}
                disabled={cart.length === 0}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-green-300 bg-green-50 text-green-800 font-semibold disabled:opacity-50"
              >
                <Banknote className="w-4 h-4" /> Espèces
              </button>
              <button
                type="button"
                onClick={() => handlePayment('card')}
                disabled={cart.length === 0}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 font-semibold disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" /> Carte
              </button>
              <button
                type="button"
                onClick={() => handlePayment('mobile_money')}
                disabled={cart.length === 0}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-orange-300 bg-orange-50 text-orange-800 font-semibold disabled:opacity-50"
              >
                <Smartphone className="w-4 h-4" /> Mobile Money
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-300 bg-white px-4 py-3 flex items-center justify-between shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div>
          <p className="text-xs text-slate-500">Total panier</p>
          <p className="text-lg font-bold text-madarail-red tabular-nums">{formatAriary(total)}</p>
        </div>
        <Button
          onClick={() => cart.length > 0 && handlePayment('cash')}
          disabled={cart.length === 0}
          className="!bg-madarail-red hover:!bg-madarail-red-dark"
        >
          Encaisser (Espèces)
        </Button>
      </div>
    </div>
  );
}

