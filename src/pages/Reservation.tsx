import { useState, useEffect, useMemo } from 'react';
import {
  Train, Search, Clock, CheckCircle2, AlertTriangle, XCircle,
  ChevronRight, ChevronLeft, Smartphone, BookOpen, UserCheck, RotateCcw,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TrainRoute, PaymentMethod, Reservation as ReservationType, Seat } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { SeatMap } from '../components/SeatMap';
import { mockRoutes } from '../utils/mockData';
import { buildSeatGrid, getSeatMapConfig } from '../utils/seatMaps';
import { formatAriary } from '../utils/format';

type Step = 1 | 2 | 3 | 4;

const PAYMENT_METHODS: Array<{ method: PaymentMethod; label: string; colors: string }> = [
  { method: 'mvola',        label: 'MVola',        colors: 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100' },
  { method: 'orange_money', label: 'Orange Money', colors: 'border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100' },
  { method: 'airtel_money', label: 'Airtel Money', colors: 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100' },
];

// ─── Carte trajet compacte ────────────────────────────────────────────────────
function RouteCard({ route, onSelect }: { route: TrainRoute; onSelect: () => void }) {
  const canSelect = route.seatsAvailable > 0;
  const stockCls = !canSelect
    ? 'bg-red-100 text-red-700 border-red-200'
    : route.seatsAvailable < 10
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200';
  const StockIcon = !canSelect ? XCircle : route.seatsAvailable < 10 ? AlertTriangle : CheckCircle2;

  return (
    <button
      type="button"
      disabled={!canSelect}
      onClick={onSelect}
      className={`rounded-2xl p-4 border-2 text-left flex flex-col gap-2 transition-all ${
        canSelect
          ? 'bg-white border-slate-200 hover:border-madarail-red hover:shadow-md cursor-pointer'
          : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-madarail-navy">{route.serviceName}</p>
          <p className="text-xs text-slate-500 font-mono">{route.trainNumber}</p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">{route.classe}</span>
      </div>
      <div>
        <p className="font-bold text-slate-900">{route.departure}</p>
        <p className="text-sm text-slate-600">→ {route.arrival}</p>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{route.departureTime} → {route.arrivalTime}</span>
        <span>{route.duration}</span>
      </div>
      <div className="flex items-end justify-between pt-2 border-t border-slate-200">
        <span className="text-xl font-bold text-madarail-red tabular-nums">{formatAriary(route.price)}</span>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-semibold ${stockCls}`}>
          <StockIcon className="w-3 h-3" />{route.seatsAvailable} pl.
        </span>
      </div>
    </button>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function Reservation() {
  const { currentUser, routes, reservations, addReservation, updateReservationStatus, setRoutes } = useApp();

  // Flow principal
  const [step, setStep] = useState<Step>(1);
  const [selectedRoute, setSelectedRoute] = useState<TrainRoute | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    passengerFirstName: '',
    passengerLastName: '',
    passengerCIN: '',
    travelDate: new Date().toISOString().split('T')[0],
  });
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [seatGrid, setSeatGrid] = useState<Seat[][]>([]);
  const [confirmedReservation, setConfirmedReservation] = useState<ReservationType | null>(null);

  // Réattribution
  const [showReassign, setShowReassign] = useState(false);
  const [reassignReservationId, setReassignReservationId] = useState<string | null>(null);
  const [reassignForm, setReassignForm] = useState({ firstName: '', lastName: '', cin: '' });
  const [reassignSeat, setReassignSeat] = useState<string | null>(null);

  useEffect(() => {
    if (routes.length === 0) setRoutes(mockRoutes);
  }, [routes, setRoutes]);

  // Filtrage par gare de l'agent
  const agentRoutes = useMemo(() => {
    if (!currentUser?.gare || currentUser.role === 'admin') return routes;
    return routes.filter(r => r.departure === currentUser.gare);
  }, [routes, currentUser]);

  const filteredRoutes = useMemo(() =>
    agentRoutes.filter(r => {
      const q = searchTerm.toLowerCase();
      return (
        r.departure.toLowerCase().includes(q) ||
        r.arrival.toLowerCase().includes(q) ||
        r.trainNumber.toLowerCase().includes(q) ||
        (r.serviceName?.toLowerCase().includes(q) ?? false)
      );
    }),
  [agentRoutes, searchTerm]);

  // Reconstruction de la grille quand route ou date changent
  useEffect(() => {
    if (!selectedRoute || !formData.travelDate) { setSeatGrid([]); return; }
    const taken = reservations
      .filter(r =>
        r.routeId === selectedRoute.id &&
        r.travelDate === formData.travelDate &&
        r.status === 'confirmed'
      )
      .map(r => r.seatNumber);
    setSeatGrid(buildSeatGrid(selectedRoute.serviceName ?? '', taken));
  }, [selectedRoute, formData.travelDate, reservations]);

  const seatConfig = useMemo(
    () => getSeatMapConfig(selectedRoute?.serviceName),
    [selectedRoute]
  );

  // Réservations confirmées pour le trajet/date sélectionnés (gestion no-show)
  const activeReservations = useMemo(() => {
    if (!selectedRoute || !formData.travelDate) return [];
    return reservations.filter(
      r => r.routeId === selectedRoute.id &&
           r.travelDate === formData.travelDate &&
           r.status === 'confirmed'
    );
  }, [selectedRoute, formData.travelDate, reservations]);

  // ── Handlers flow principal ──────────────────────────────────────────────
  const handleSelectRoute = (route: TrainRoute) => {
    setSelectedRoute(route);
    setSelectedSeat(null);
    setStep(2);
  };

  const handleConfirmPassenger = () => {
    if (!formData.passengerFirstName.trim() || !formData.passengerLastName.trim() || !formData.passengerCIN.trim()) return;
    setStep(3);
  };

  const handleConfirmPayment = (method: PaymentMethod) => {
    if (!selectedRoute || !selectedSeat || !currentUser) return;

    // Vérification finale que le siège est encore libre
    const alreadyTaken = reservations.some(
      r =>
        r.routeId === selectedRoute.id &&
        r.travelDate === formData.travelDate &&
        r.seatNumber === selectedSeat &&
        r.status === 'confirmed'
    );
    if (alreadyTaken) {
      window.alert('Ce siège vient d\'être réservé. Veuillez en choisir un autre.');
      setSelectedSeat(null);
      return;
    }

    const subtotal = selectedRoute.price;
    const tax      = subtotal * 0.2;
    const res: ReservationType = {
      id: `RES-${Date.now()}`,
      routeId: selectedRoute.id,
      route: selectedRoute,
      seatNumber: selectedSeat,
      ...formData,
      paymentMethod: method,
      subtotal,
      tax,
      total: subtotal + tax,
      agentId: currentUser.id,
      agentName: currentUser.name,
      gare: currentUser.gare || '',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    addReservation(res);
    setRoutes(routes.map(r =>
      r.id === selectedRoute.id
        ? { ...r, seatsAvailable: Math.max(0, r.seatsAvailable - 1) }
        : r
    ));
    setConfirmedReservation(res);
    setStep(4);
  };

  const resetFlow = () => {
    setStep(1);
    setSelectedRoute(null);
    setSelectedSeat(null);
    setConfirmedReservation(null);
    setSearchTerm('');
    setFormData({ passengerFirstName: '', passengerLastName: '', passengerCIN: '', travelDate: new Date().toISOString().split('T')[0] });
  };

  // ── Handlers réattribution ───────────────────────────────────────────────
  const handleNoShow = (resId: string) => {
    if (confirm('Confirmer l\'absence du passager ? Le siège sera libéré.')) {
      updateReservationStatus(resId, 'no_show');
    }
  };

  const handleStartReassign = (resId: string) => {
    setReassignReservationId(resId);
    setReassignSeat(null);
    setReassignForm({ firstName: '', lastName: '', cin: '' });
    setShowReassign(true);
  };

  // Grille pour réattribution (siège original libéré)
  const reassignGrid = useMemo(() => {
    if (!selectedRoute || !formData.travelDate || !reassignReservationId) return [];
    const originalRes = reservations.find(r => r.id === reassignReservationId);
    const taken = reservations
      .filter(r =>
        r.routeId === selectedRoute.id &&
        r.travelDate === formData.travelDate &&
        r.status === 'confirmed' &&
        r.id !== reassignReservationId
      )
      .map(r => r.seatNumber);
    // Inclure le siège original comme libre pour qu'il soit sélectionnable
    if (originalRes) {
      const idx = taken.indexOf(originalRes.seatNumber);
      if (idx > -1) taken.splice(idx, 1);
    }
    return buildSeatGrid(selectedRoute.serviceName ?? '', taken);
  }, [selectedRoute, formData.travelDate, reservations, reassignReservationId]);

  const handleConfirmReassign = () => {
    if (!reassignReservationId || !reassignSeat || !currentUser || !selectedRoute) return;
    if (!reassignForm.firstName.trim() || !reassignForm.lastName.trim() || !reassignForm.cin.trim()) return;

    updateReservationStatus(reassignReservationId, 'reassigned', {
      passengerFirstName: reassignForm.firstName.trim(),
      passengerLastName:  reassignForm.lastName.trim(),
      passengerCIN:       reassignForm.cin.trim(),
      agentId: currentUser.id,
      reassignedAt: new Date().toISOString(),
    });

    // Nouvelle réservation pour le nouveau passager
    const original = reservations.find(r => r.id === reassignReservationId)!;
    const subtotal  = selectedRoute.price;
    const tax       = subtotal * 0.2;
    addReservation({
      id: `RES-${Date.now()}`,
      routeId: selectedRoute.id,
      route: selectedRoute,
      seatNumber: reassignSeat,
      passengerFirstName: reassignForm.firstName.trim(),
      passengerLastName:  reassignForm.lastName.trim(),
      passengerCIN:       reassignForm.cin.trim(),
      travelDate: original.travelDate,
      paymentMethod: original.paymentMethod,
      subtotal,
      tax,
      total: subtotal + tax,
      agentId: currentUser.id,
      agentName: currentUser.name,
      gare: currentUser.gare || '',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    });

    setShowReassign(false);
    setReassignReservationId(null);
    alert('Siège réattribué avec succès.');
  };

  // ── Rendu ────────────────────────────────────────────────────────────────
  const stepLabel = ['', 'Trajet', 'Passager', 'Siège', 'Confirmation'];

  return (
    <div className="space-y-6 min-w-0">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-madarail-red p-2.5 rounded-xl shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Réservations</h1>
            <p className="text-sm text-gray-500">Choisissez un trajet, un passager et un siège</p>
          </div>
        </div>
        {step > 1 && step < 4 && (
          <Button variant="secondary" onClick={resetFlow} className="flex w-full sm:w-auto items-center justify-center gap-2 shrink-0">
            <RotateCcw className="w-4 h-4" /> Recommencer
          </Button>
        )}
      </div>

      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {([1, 2, 3, 4] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step === s ? 'bg-madarail-red text-white' :
              step > s  ? 'bg-emerald-500 text-white' :
                          'bg-slate-200 text-slate-500'
            }`}>
              {step > s ? '✓' : s}
            </div>
            <span className={`text-sm font-medium hidden sm:inline ${step === s ? 'text-madarail-red' : step > s ? 'text-emerald-600' : 'text-slate-400'}`}>
              {stepLabel[s]}
            </span>
            {i < 3 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300 shrink-0" />}
          </div>
        ))}
      </div>

      {/* ── ÉTAPE 1 : Sélection trajet ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="search"
              placeholder="Rechercher gare, train, service…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 text-base focus:border-madarail-red focus:ring-2 focus:ring-madarail-red/25 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRoutes.map(route => (
              <RouteCard key={route.id} route={route} onSelect={() => handleSelectRoute(route)} />
            ))}
          </div>
          {filteredRoutes.length === 0 && (
            <div className="flex flex-col items-center py-20 text-slate-400">
              <Train className="w-14 h-14 mb-4 opacity-40" />
              <p className="font-medium">Aucun trajet pour cette recherche</p>
            </div>
          )}
        </div>
      )}

      {/* ── ÉTAPE 2 : Saisie passager ── */}
      {step === 2 && selectedRoute && (
        <div className="max-w-lg space-y-6">
          {/* Résumé trajet */}
          <Card>
            <div className="flex items-center gap-3">
              <div className="bg-madarail-red-soft p-2.5 rounded-lg"><Train className="w-5 h-5 text-madarail-red" /></div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">{selectedRoute.serviceName}</p>
                <p className="font-bold text-slate-900">{selectedRoute.departure} → {selectedRoute.arrival}</p>
                <p className="text-sm text-slate-500">{selectedRoute.trainNumber} · {selectedRoute.departureTime} · {formatAriary(selectedRoute.price)} TTC</p>
              </div>
            </div>
          </Card>

          <Card title="Informations passager">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Prénom" value={formData.passengerFirstName} onChange={e => setFormData({ ...formData, passengerFirstName: e.target.value })} placeholder="Jean" required />
                <Input label="Nom" value={formData.passengerLastName} onChange={e => setFormData({ ...formData, passengerLastName: e.target.value })} placeholder="RAKOTO" required />
              </div>
              <Input label="N° CIN" value={formData.passengerCIN} onChange={e => setFormData({ ...formData, passengerCIN: e.target.value })} placeholder="101 234 567 890" required />
              <Input
                label="Date de voyage"
                type="date"
                value={formData.travelDate}
                onChange={e => setFormData({ ...formData, travelDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Retour
            </Button>
            <Button
              onClick={handleConfirmPassenger}
              disabled={!formData.passengerFirstName.trim() || !formData.passengerLastName.trim() || !formData.passengerCIN.trim()}
              className="flex-1 !bg-madarail-red hover:!bg-madarail-red-dark flex items-center justify-center gap-2"
            >
              Choisir un siège <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── ÉTAPE 3 : Plan des sièges ── */}
      {step === 3 && selectedRoute && (
        <div className="max-w-2xl space-y-6">
          <Card title="Choisissez votre siège">
            {seatConfig ? (
              <SeatMap
                seats={seatGrid}
                selectedSeat={selectedSeat}
                onSeatSelect={setSelectedSeat}
                config={seatConfig}
              />
            ) : (
              <p className="text-slate-500 text-sm py-4">
                Aucun plan de sièges disponible pour ce service. La réservation assigne un siège automatiquement.
              </p>
            )}
            {selectedSeat && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Siège {selectedSeat} sélectionné
              </div>
            )}
          </Card>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(2)} className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Retour
            </Button>
            <Button
              onClick={() => setStep(4)}
              disabled={!selectedSeat && !!seatConfig}
              className="flex-1 !bg-madarail-red hover:!bg-madarail-red-dark flex items-center justify-center gap-2"
            >
              Passer au paiement <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── ÉTAPE 4 : Paiement + confirmation ── */}
      {step === 4 && !confirmedReservation && selectedRoute && (
        <div className="max-w-md space-y-6">
          <Card title="Récapitulatif">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Trajet</span><span className="font-medium">{selectedRoute.departure} → {selectedRoute.arrival}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Train</span><span className="font-medium">{selectedRoute.trainNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Passager</span><span className="font-medium">{formData.passengerLastName} {formData.passengerFirstName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">CIN</span><span className="font-medium">{formData.passengerCIN}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium">{new Date(formData.travelDate).toLocaleDateString('fr-FR')}</span></div>
              {selectedSeat && <div className="flex justify-between"><span className="text-slate-500">Siège</span><span className="font-bold text-madarail-red">{selectedSeat}</span></div>}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-slate-500"><span>Sous-total</span><span>{formatAriary(selectedRoute.price)}</span></div>
                <div className="flex justify-between text-slate-500"><span>TVA 20 %</span><span>{formatAriary(selectedRoute.price * 0.2)}</span></div>
                <div className="flex justify-between text-xl font-bold"><span>Total TTC</span><span className="text-madarail-red">{formatAriary(selectedRoute.price * 1.2)}</span></div>
              </div>
            </div>
          </Card>

          <Card title="Paiement Mobile Money">
            <div className="space-y-3">
              {PAYMENT_METHODS.map(({ method, label, colors }) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleConfirmPayment(method)}
                  className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-bold text-base transition-colors ${colors}`}
                >
                  <Smartphone className="w-5 h-5" /> {label}
                </button>
              ))}
            </div>
          </Card>

          <Button variant="secondary" onClick={() => setStep(3)} className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Retour
          </Button>
        </div>
      )}

      {/* Ticket de confirmation */}
      {step === 4 && confirmedReservation && (
        <div className="max-w-md space-y-4">
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <p className="text-lg font-bold text-emerald-800">Réservation confirmée</p>
                <p className="text-sm text-emerald-600 font-mono">{confirmedReservation.id}</p>
              </div>
            </div>
            <div className="border-t border-emerald-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Trajet</span><span className="font-medium">{confirmedReservation.route.departure} → {confirmedReservation.route.arrival}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Train</span><span className="font-medium">{confirmedReservation.route.trainNumber}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Passager</span><span className="font-medium">{confirmedReservation.passengerLastName} {confirmedReservation.passengerFirstName}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Date</span><span className="font-medium">{new Date(confirmedReservation.travelDate).toLocaleDateString('fr-FR')}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Siège</span><span className="font-bold text-madarail-red text-base">{confirmedReservation.seatNumber}</span></div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-emerald-200"><span>Total</span><span className="text-madarail-red">{formatAriary(confirmedReservation.total)}</span></div>
            </div>
          </div>
          <Button onClick={resetFlow} className="w-full !bg-madarail-red hover:!bg-madarail-red-dark">
            Nouvelle réservation
          </Button>
        </div>
      )}

      {/* ── Section réattribution ── */}
      {selectedRoute && step >= 2 && activeReservations.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-800">Gérer les réservations — {selectedRoute.departure} → {selectedRoute.arrival}</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Date : {new Date(formData.travelDate).toLocaleDateString('fr-FR')} · {activeReservations.length} réservation(s)
          </p>
          <div className="space-y-3">
            {activeReservations.map(res => (
              <div key={res.id} className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4">
                <div>
                  <p className="font-semibold text-slate-900">{res.passengerLastName} {res.passengerFirstName}</p>
                  <p className="text-xs text-slate-500">CIN : {res.passengerCIN} · Siège <span className="font-bold text-madarail-red">{res.seatNumber}</span></p>
                  <p className="text-xs text-slate-400 font-mono">{res.id}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleNoShow(res.id)}
                    className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100"
                  >
                    Non présenté
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartReassign(res.id)}
                    className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-300 text-blue-800 text-xs font-semibold hover:bg-blue-100"
                  >
                    Réattribuer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal réattribution */}
      {showReassign && reassignReservationId && selectedRoute && seatConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Réattribuer le siège</h3>
              <button onClick={() => setShowReassign(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Nouveau passager</p>
                <Input label="Prénom" value={reassignForm.firstName} onChange={e => setReassignForm({ ...reassignForm, firstName: e.target.value })} placeholder="Prénom" />
                <Input label="Nom" value={reassignForm.lastName} onChange={e => setReassignForm({ ...reassignForm, lastName: e.target.value })} placeholder="Nom" />
                <Input label="N° CIN" value={reassignForm.cin} onChange={e => setReassignForm({ ...reassignForm, cin: e.target.value })} placeholder="CIN" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Choisir un siège</p>
                <SeatMap seats={reassignGrid} selectedSeat={reassignSeat} onSeatSelect={setReassignSeat} config={seatConfig} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowReassign(false)} className="flex-1">Annuler</Button>
              <Button
                onClick={handleConfirmReassign}
                disabled={!reassignSeat || !reassignForm.firstName.trim() || !reassignForm.lastName.trim() || !reassignForm.cin.trim()}
                className="flex-1 !bg-madarail-red hover:!bg-madarail-red-dark"
              >
                Confirmer la réattribution
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
