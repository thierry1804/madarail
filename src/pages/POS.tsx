import { useState, useEffect, useMemo } from 'react';
import {
  Trash2, Plus, Minus, Smartphone, Ticket, Train, Clock,
  Search, MapPin, CheckCircle2, AlertTriangle, XCircle, X,
  ShoppingCart, ChevronDown,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TicketItem, Sale, TrainRoute, PaymentMethod } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { mockRoutes } from '../utils/mockData';
import { formatAriary } from '../utils/format';

// ─── Constantes ──────────────────────────────────────────────────────────────

const LINE_FILTERS: { id: string; label: string }[] = [
  { id: '',    label: 'Toutes' },
  { id: 'TCE', label: 'TCE' },
  { id: 'TA',  label: 'TA' },
  { id: 'MOR', label: 'MOR' },
];

const PAYMENT_METHODS: Array<{ method: PaymentMethod; label: string; colors: string }> = [
  { method: 'mvola',        label: 'MVola',        colors: 'border-red-300 bg-red-50 text-red-800 active:bg-red-100' },
  { method: 'orange_money', label: 'Orange Money', colors: 'border-orange-300 bg-orange-50 text-orange-800 active:bg-orange-100' },
  { method: 'airtel_money', label: 'Airtel Money', colors: 'border-blue-300 bg-blue-50 text-blue-800 active:bg-blue-100' },
];

// ─── Carte trajet ─────────────────────────────────────────────────────────────

function RouteSaleCard({
  route, canSelect, isSelected, onSelect,
}: {
  route: TrainRoute;
  canSelect: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const stockState =
    route.seatsAvailable <= 0
      ? { cls: 'bg-red-100 text-red-700 border-red-200',                  icon: XCircle,       count: 'Complet' }
      : route.seatsAvailable < 10
      ? { cls: 'bg-amber-100 text-amber-800 border-amber-200',            icon: AlertTriangle, count: `${route.seatsAvailable} pl.` }
      : { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200',      icon: CheckCircle2,  count: `${route.seatsAvailable} pl.` };
  const StockIcon = stockState.icon;

  return (
    <button
      type="button"
      disabled={!canSelect}
      onClick={() => canSelect && onSelect(route.id)}
      className={`rounded-2xl p-4 border-2 text-left flex flex-col gap-1.5 transition-all active:scale-[0.98] ${
        isSelected
          ? 'bg-madarail-red/5 border-madarail-red shadow-md ring-2 ring-madarail-red/30'
          : canSelect
          ? 'bg-white border-slate-200 hover:border-madarail-red hover:shadow-sm'
          : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Service + classe */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-madarail-navy truncate">
            {route.serviceName ?? 'Trajet'}
          </p>
          <p className="text-xs text-slate-400 font-mono">{route.trainNumber}</p>
        </div>
        <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border bg-blue-100 text-blue-700 border-blue-200">
          {route.classe}
        </span>
      </div>

      {/* Départ → Arrivée */}
      <div>
        <p className="text-base font-bold text-slate-900 leading-tight">{route.departure}</p>
        <p className="text-sm text-slate-500">→ {route.arrival}</p>
      </div>

      {/* Horaires */}
      <p className="text-xs text-slate-400 flex items-center gap-1">
        <Clock className="w-3 h-3 shrink-0" />
        {route.departureTime} → {route.arrivalTime} · {route.duration}
      </p>

      {/* Prix + stock */}
      <div className="pt-2 mt-auto border-t border-slate-200 flex items-end justify-between gap-2">
        <span className="text-xl font-bold text-madarail-red tabular-nums">
          {formatAriary(route.price)}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${stockState.cls}`}>
          <StockIcon className="w-3 h-3" />{stockState.count}
        </span>
      </div>
    </button>
  );
}

// ─── Bottom-sheet générique ───────────────────────────────────────────────────

function BottomSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[92dvh] flex flex-col pb-[env(safe-area-inset-bottom,0px)]">
        {/* Poignée */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-slate-300" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 shrink-0 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface POSProps {
  readOnly?: boolean;
}

export function POS({ readOnly = false }: POSProps) {
  const { currentUser, addSale, setRoutes, routes } = useApp();

  // État panier
  const [cart, setCart] = useState<TicketItem[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Formulaire passager (partagé desktop + mobile)
  const [passengerFirstName, setPassengerFirstName] = useState('');
  const [passengerLastName,  setPassengerLastName]  = useState('');
  const [passengerCIN,       setPassengerCIN]       = useState('');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);

  // Filtres catalogue
  const [searchTerm,      setSearchTerm]      = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedLine,    setSelectedLine]    = useState('');

  // Horloge
  const [now, setNow] = useState(() => new Date());

  // Bottom sheets (mobile uniquement)
  const [sheetPassenger, setSheetPassenger] = useState(false);
  const [sheetCart,      setSheetCart]      = useState(false);
  const [sheetPayment,   setSheetPayment]   = useState(false);

  useEffect(() => {
    if (routes.length === 0) setRoutes(mockRoutes);
  }, [routes, setRoutes]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Routes filtrées par gare d'affectation
  const agentRoutes = useMemo(() => {
    if (!currentUser?.gare || currentUser.role === 'admin') return routes;
    return routes.filter(r => r.departure === currentUser.gare);
  }, [routes, currentUser]);

  const services = useMemo(() => {
    const names = new Set<string>();
    agentRoutes.forEach(r => { if (r.serviceName) names.add(r.serviceName); });
    return Array.from(names).sort();
  }, [agentRoutes]);

  const filteredRoutes = useMemo(() => agentRoutes.filter(route => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      route.name.toLowerCase().includes(q) ||
      route.departure.toLowerCase().includes(q) ||
      route.arrival.toLowerCase().includes(q) ||
      route.trainNumber.toLowerCase().includes(q) ||
      (route.serviceName?.toLowerCase().includes(q) ?? false);
    return matchSearch &&
      (!selectedService || route.serviceName === selectedService) &&
      (!selectedLine    || route.category    === selectedLine);
  }), [agentRoutes, searchTerm, selectedService, selectedLine]);

  const routesAvail   = useMemo(() => filteredRoutes.filter(r => r.seatsAvailable > 0), [filteredRoutes]);
  const routesSoldOut = useMemo(() => filteredRoutes.filter(r => r.seatsAvailable <= 0), [filteredRoutes]);

  const selectedRoute = useMemo(
    () => routes.find(r => r.id === selectedRouteId) ?? null,
    [routes, selectedRouteId]
  );

  const { subtotal, tax, total } = useMemo(() => {
    const sub = cart.reduce((s, i) => s + i.route.price * i.quantity, 0);
    const t   = sub * 0.2;
    return { subtotal: sub, tax: t, total: sub + t };
  }, [cart]);

  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleRouteSelect = (id: string) => {
    setSelectedRouteId(id);
    if (!readOnly) setSheetPassenger(true); // ouvre le sheet passager sur mobile
  };

  const clearPassengerForm = () => {
    setPassengerFirstName('');
    setPassengerLastName('');
    setPassengerCIN('');
  };

  const canAddToCart = !!selectedRoute &&
    passengerFirstName.trim() !== '' &&
    passengerLastName.trim()  !== '' &&
    passengerCIN.trim()       !== '';

  const addToCart = () => {
    if (!selectedRoute || !canAddToCart) return;
    const qtyAlready = cart
      .filter(i => i.route.id === selectedRoute.id)
      .reduce((s, i) => s + i.quantity, 0);
    if (qtyAlready + 1 > selectedRoute.seatsAvailable) {
      window.alert('Plus de places disponibles pour ce trajet.');
      return;
    }
    setCart(prev => [...prev, {
      route: selectedRoute,
      quantity: 1,
      passengerFirstName: passengerFirstName.trim(),
      passengerLastName:  passengerLastName.trim(),
      passengerCIN:       passengerCIN.trim(),
      travelDate,
    }]);
    clearPassengerForm();
    setSheetPassenger(false);
  };

  const updateQuantity = (index: number, change: number) => {
    const item = cart[index];
    if (!item) return;
    const newQty = item.quantity + change;
    if (newQty <= 0) { setCart(cart.filter((_, i) => i !== index)); return; }
    if (change > 0) {
      const live = routes.find(r => r.id === item.route.id);
      if (!live) return;
      const elsewhere = cart.reduce((s, l, i) =>
        i === index ? s : l.route.id === item.route.id ? s + l.quantity : s, 0);
      if (elsewhere + newQty > live.seatsAvailable) {
        window.alert('Nombre de places insuffisant pour ce trajet.');
        return;
      }
    }
    setCart(cart.map((l, i) => i === index ? { ...l, quantity: newQty } : l));
  };

  const removeFromCart = (index: number) => setCart(cart.filter((_, i) => i !== index));

  const handlePayment = (method: PaymentMethod) => {
    if (cart.length === 0) return;
    const seatsByRoute = new Map<string, number>();
    for (const item of cart) seatsByRoute.set(item.route.id, (seatsByRoute.get(item.route.id) ?? 0) + item.quantity);
    for (const [routeId, qty] of seatsByRoute) {
      const r = routes.find(x => x.id === routeId);
      if (!r || r.seatsAvailable < qty) {
        window.alert('Pas assez de places disponibles. Videz le panier et réessayez.');
        return;
      }
    }
    const sale: Sale = {
      id: `BIL-${Date.now()}`,
      items: cart,
      subtotal,
      tax,
      total,
      paymentMethod: method,
      agentId:   currentUser!.id,
      agentName: currentUser!.name,
      gare:      currentUser!.gare || 'Antananarivo',
      createdAt: new Date().toISOString(),
    };
    addSale(sale);
    setRoutes(routes.map(r => {
      const sold = seatsByRoute.get(r.id);
      return sold ? { ...r, seatsAvailable: Math.max(0, r.seatsAvailable - sold) } : r;
    }));
    setCart([]);
    setSheetPayment(false);
    setSheetCart(false);
  };

  // ── Formulaire passager (réutilisé desktop + sheet mobile) ────────────────

  const PassengerForm = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {selectedRoute ? (
        <div className="rounded-xl bg-madarail-red/5 border border-madarail-red/20 p-3">
          <p className="text-xs font-semibold text-madarail-navy uppercase truncate">{selectedRoute.serviceName}</p>
          <p className="font-bold text-slate-900">{selectedRoute.departure} → {selectedRoute.arrival}</p>
          <p className="text-xs text-slate-500">{selectedRoute.trainNumber} · {selectedRoute.departureTime} · {formatAriary(selectedRoute.price)}</p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Sélectionnez un trajet dans le catalogue.</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Prénom" value={passengerFirstName} onChange={e => setPassengerFirstName(e.target.value)} placeholder="Jean" />
        <Input label="Nom" value={passengerLastName} onChange={e => setPassengerLastName(e.target.value)} placeholder="RAKOTO" />
      </div>
      <Input label="N° CIN" value={passengerCIN} onChange={e => setPassengerCIN(e.target.value)} placeholder="101 234 567 890" />
      <Input label="Date de voyage" type="date" value={travelDate}
        onChange={e => setTravelDate(e.target.value)}
        min={new Date().toISOString().split('T')[0]} />
      <Button
        onClick={addToCart}
        disabled={!canAddToCart}
        className="w-full !bg-madarail-red hover:!bg-madarail-red-dark"
      >
        Ajouter au panier
      </Button>
    </div>
  );

  // ── Contenu panier (réutilisé desktop + sheet mobile) ────────────────────

  const CartItems = () => (
    <>
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Ticket className="w-12 h-12 mb-3 opacity-40" />
          <p className="font-medium text-slate-500">Panier vide</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cart.map((item, index) => (
            <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex justify-between items-start gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-sm leading-tight">
                    {item.route.departure} → {item.route.arrival}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.route.trainNumber} · {item.passengerLastName} {item.passengerFirstName}
                  </p>
                  <p className="text-xs text-slate-400">CIN : {item.passengerCIN}</p>
                </div>
                <button type="button" onClick={() => removeFromCart(index)}
                  className="shrink-0 text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200">
                  <button type="button" onClick={() => updateQuantity(index, -1)}
                    className="p-2.5 hover:bg-slate-100 rounded-l-lg active:bg-slate-200">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-9 text-center font-bold tabular-nums">{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(index, 1)}
                    className="p-2.5 hover:bg-slate-100 rounded-r-lg active:bg-slate-200">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="font-bold tabular-nums">{formatAriary(item.route.price * item.quantity)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  // ── Récapitulatif + paiement ─────────────────────────────────────────────

  const PaymentSection = ({ stacked = false }: { stacked?: boolean }) => (
    <div className="space-y-3">
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Sous-total</span><span className="tabular-nums">{formatAriary(subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>TVA 20 %</span><span className="tabular-nums">{formatAriary(tax)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold pt-2 border-t border-slate-200">
          <span>Total</span>
          <span className="text-madarail-red tabular-nums">{formatAriary(total)}</span>
        </div>
      </div>
      <div className={stacked ? 'space-y-2' : 'grid grid-cols-3 gap-2'}>
        {PAYMENT_METHODS.map(({ method, label, colors }) => (
          <button
            key={method}
            type="button"
            onClick={() => handlePayment(method)}
            disabled={cart.length === 0}
            className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 font-semibold text-sm disabled:opacity-40 transition-all active:scale-95 ${colors}`}
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            {stacked ? label : <span className="truncate">{label}</span>}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-0 bg-madarail-navy">

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 bg-[#061525] text-white border-b border-madarail-navy-bright">
        <div className="rounded-lg bg-madarail-red p-2 shrink-0">
          <Ticket className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold leading-tight truncate">
            Caisse billets{readOnly ? ' — Consultation' : ''}
          </h1>
          <p className="text-xs text-slate-400 truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {currentUser?.gare ?? 'Gare'}
          </p>
        </div>
        <div className="shrink-0 font-mono text-sm tabular-nums text-slate-300">
          {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      {readOnly && (
        <div className="shrink-0 bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-amber-300 text-xs font-semibold text-center">
          Mode consultation — la vente est désactivée pour les contrôleurs
        </div>
      )}

      {/* ── Corps principal ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Catalogue — plein écran mobile, col gauche desktop */}
        <section className="flex-1 flex flex-col min-w-0 min-h-0 bg-slate-100">

          {/* Barre de filtres */}
          <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-3 space-y-2.5">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Gare, train, service…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:border-madarail-red focus:ring-2 focus:ring-madarail-red/20 outline-none bg-slate-50"
              />
            </div>

            {/* Filtres service + ligne sur une seule ligne scrollable */}
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
              {/* Service */}
              <button
                type="button"
                onClick={() => setSelectedService('')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  !selectedService ? 'bg-madarail-red text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >Tous</button>
              {services.map(svc => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => setSelectedService(svc === selectedService ? '' : svc)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedService === svc ? 'bg-madarail-red text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >{svc}</button>
              ))}
              <div className="w-px bg-slate-200 shrink-0 my-0.5" />
              {LINE_FILTERS.map(line => (
                <button
                  key={line.id || 'all'}
                  type="button"
                  onClick={() => setSelectedLine(line.id === selectedLine ? '' : line.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedLine === line.id ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-madarail-red'
                  }`}
                >{line.label}</button>
              ))}
            </div>
          </div>

          {/* Grille de trajets */}
          <div className="flex-1 overflow-y-auto p-3 pb-24 lg:pb-3">
            {filteredRoutes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400">
                <Train className="w-14 h-14 mb-3 opacity-30" />
                <p className="font-medium">Aucun trajet pour ces filtres</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {routesAvail.map(route => (
                    <RouteSaleCard
                      key={route.id}
                      route={route}
                      canSelect={!readOnly}
                      isSelected={selectedRouteId === route.id}
                      onSelect={handleRouteSelect}
                    />
                  ))}
                </div>
                {routesSoldOut.length > 0 && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mt-5 mb-3 px-1">
                      Complets
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 opacity-60">
                      {routesSoldOut.map(route => (
                        <RouteSaleCard
                          key={route.id}
                          route={route}
                          canSelect={false}
                          isSelected={false}
                          onSelect={handleRouteSelect}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── Panneau panier — desktop uniquement ── */}
        {!readOnly && (
          <aside className="hidden lg:flex flex-col w-96 shrink-0 bg-white border-l border-slate-200 min-h-0">
            {/* Entête panier */}
            <div className="shrink-0 px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-madarail-red" />
                <h2 className="text-lg font-bold text-slate-900">Panier</h2>
              </div>
              <span className="text-sm text-slate-500">{totalQty} billet(s)</span>
            </div>

            {/* Formulaire passager */}
            <div className="shrink-0 px-5 py-4 border-b border-slate-200 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">Nouveau billet</p>
              <PassengerForm />
            </div>

            {/* Lignes panier */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <CartItems />
            </div>

            {/* Récapitulatif + paiement */}
            <div className="shrink-0 px-5 py-4 border-t-2 border-slate-200 bg-white">
              <PaymentSection stacked={false} />
            </div>
          </aside>
        )}
      </div>

      {/* ── Footer mobile (lg:hidden) ── */}
      {!readOnly && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom,0px)]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3">
            <button
              type="button"
              onClick={() => setSheetCart(true)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white font-semibold text-sm text-slate-700 active:bg-slate-50"
            >
              <ShoppingCart className="w-5 h-5" />
              Panier
              {totalQty > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-madarail-red text-white text-xs font-bold flex items-center justify-center">
                  {totalQty}
                </span>
              )}
            </button>
            <div className="flex-1 text-right">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-lg font-bold text-madarail-red tabular-nums leading-tight">{formatAriary(total)}</p>
            </div>
            <Button
              onClick={() => cart.length > 0 && setSheetPayment(true)}
              disabled={cart.length === 0}
              className="shrink-0 !bg-madarail-red hover:!bg-madarail-red-dark px-5"
            >
              Encaisser
            </Button>
          </div>
        </div>
      )}

      {/* ── Sheet : Ajout passager (mobile) ── */}
      <BottomSheet open={sheetPassenger} onClose={() => setSheetPassenger(false)} title="Nouveau billet">
        <div className="px-5 py-4">
          <PassengerForm />
        </div>
      </BottomSheet>

      {/* ── Sheet : Panier (mobile) ── */}
      <BottomSheet open={sheetCart} onClose={() => setSheetCart(false)} title={`Panier · ${totalQty} billet(s)`}>
        <div className="px-5 py-4 space-y-4">
          <CartItems />
          {cart.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <Button
                onClick={() => { setSheetCart(false); setSheetPayment(true); }}
                className="w-full !bg-madarail-red hover:!bg-madarail-red-dark"
              >
                Encaisser — {formatAriary(total)}
              </Button>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* ── Sheet : Paiement (mobile) ── */}
      <BottomSheet open={sheetPayment} onClose={() => setSheetPayment(false)} title="Paiement Mobile Money">
        <div className="px-5 py-4">
          <PaymentSection stacked={true} />
          <button
            type="button"
            onClick={() => setSheetPayment(false)}
            className="w-full mt-4 py-3 text-slate-500 text-sm font-medium"
          >
            Annuler
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
