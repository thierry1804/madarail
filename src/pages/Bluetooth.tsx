import { useState } from 'react';
import { Bluetooth as BluetoothIcon, WifiOff, CheckCircle, AlertCircle, Loader2, Radio } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

type SyncState = 'idle' | 'scanning' | 'connecting' | 'transferring' | 'done' | 'error';

interface SyncStep {
  state: SyncState;
  label: string;
  duration: number; // ms
}

const SYNC_STEPS: SyncStep[] = [
  { state: 'scanning',    label: 'Recherche des appareils BLE…',        duration: 1500 },
  { state: 'connecting',  label: 'Connexion à la tablette contrôleur…', duration: 1200 },
  { state: 'transferring',label: 'Transfert des données en cours…',      duration: 2000 },
  { state: 'done',        label: 'Synchronisation terminée',             duration: 0    },
];

export function Bluetooth() {
  const { sales, reservations } = useApp();
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [progress, setProgress]   = useState(0);
  const [errorMsg, setErrorMsg]   = useState('');

  const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

  const pendingSales        = sales.length;
  const pendingReservations = reservations.filter(r => r.status === 'confirmed').length;

  const startSync = () => {
    if (syncState === 'scanning' || syncState === 'connecting' || syncState === 'transferring') return;

    setSyncState('idle');
    setProgress(0);
    setErrorMsg('');

    let stepIndex = 0;
    let elapsed   = 0;
    const totalDuration = SYNC_STEPS.reduce((s, step) => s + step.duration, 0);

    const runStep = () => {
      if (stepIndex >= SYNC_STEPS.length) return;

      const step = SYNC_STEPS[stepIndex];
      setSyncState(step.state);

      if (step.state === 'done') {
        setProgress(100);
        return;
      }

      const stepStart = Date.now();
      const interval  = setInterval(() => {
        const stepElapsed = Date.now() - stepStart;
        const overallProgress = ((elapsed + stepElapsed) / totalDuration) * 100;
        setProgress(Math.min(overallProgress, 100));
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        elapsed += step.duration;
        stepIndex++;
        runStep();
      }, step.duration);
    };

    runStep();
  };

  const reset = () => {
    setSyncState('idle');
    setProgress(0);
    setErrorMsg('');
  };

  const isRunning = syncState === 'scanning' || syncState === 'connecting' || syncState === 'transferring';

  const stepLabels: Record<SyncState, string> = {
    idle:        '',
    scanning:    'Recherche des appareils BLE…',
    connecting:  'Connexion à la tablette contrôleur…',
    transferring:'Transfert des données en cours…',
    done:        'Synchronisation terminée avec succès',
    error:       errorMsg || 'Une erreur est survenue',
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Synchronisation Bluetooth</h1>
        <p className="text-gray-600 mt-1">Transfert des données vers la tablette du contrôleur</p>
      </div>

      {/* Avertissement HTTPS */}
      {!isHttps && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-lg text-amber-800">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Connexion non sécurisée</p>
            <p className="text-sm mt-0.5">
              Le Web Bluetooth nécessite une connexion HTTPS. Cette page est accessible uniquement
              à titre de démonstration UI en développement local.
            </p>
          </div>
        </div>
      )}

      {/* Résumé des données */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <p className="text-sm text-gray-600 mb-1">Ventes à synchroniser</p>
          <p className="text-3xl font-bold text-gray-900">{pendingSales}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Réservations confirmées</p>
          <p className="text-3xl font-bold text-gray-900">{pendingReservations}</p>
        </Card>
      </div>

      {/* Panneau de synchronisation */}
      <Card>
        <div className="flex flex-col items-center py-6 gap-6">

          {/* Icône animée */}
          <div className={`relative flex items-center justify-center w-24 h-24 rounded-full
            ${syncState === 'done'  ? 'bg-green-100' :
              syncState === 'error' ? 'bg-red-100'   :
              isRunning             ? 'bg-blue-100'  : 'bg-slate-100'}`}>
            {syncState === 'done' ? (
              <CheckCircle className="w-12 h-12 text-green-600" />
            ) : syncState === 'error' ? (
              <AlertCircle className="w-12 h-12 text-red-600" />
            ) : isRunning ? (
              <>
                <Radio className="w-12 h-12 text-blue-600 animate-pulse" />
                <span className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-30" />
              </>
            ) : (
              <BluetoothIcon className="w-12 h-12 text-slate-500" />
            )}
          </div>

          {/* Étiquette état */}
          <div className="text-center">
            {syncState !== 'idle' && (
              <p className={`font-medium text-base
                ${syncState === 'done'  ? 'text-green-700' :
                  syncState === 'error' ? 'text-red-700'   : 'text-gray-800'}`}>
                {stepLabels[syncState]}
              </p>
            )}
            {syncState === 'idle' && (
              <p className="text-gray-500">Prêt à synchroniser</p>
            )}
          </div>

          {/* Barre de progression */}
          {(isRunning || syncState === 'done') && (
            <div className="w-full max-w-sm">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progression</span>
                <span>{Math.round(progress)} %</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-100
                    ${syncState === 'done' ? 'bg-green-500' : 'bg-blue-600'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3">
            {(syncState === 'idle' || syncState === 'done' || syncState === 'error') && (
              <Button
                onClick={syncState === 'idle' ? startSync : reset}
                className="!bg-madarail-red hover:!bg-madarail-red-dark flex items-center gap-2"
              >
                {syncState === 'done' || syncState === 'error' ? (
                  'Recommencer'
                ) : (
                  <>
                    <BluetoothIcon className="w-4 h-4" />
                    Démarrer la synchronisation
                  </>
                )}
              </Button>
            )}

            {isRunning && (
              <Button disabled className="flex items-center gap-2 opacity-60 cursor-not-allowed">
                <Loader2 className="w-4 h-4 animate-spin" />
                Synchronisation en cours…
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Détail des étapes */}
      {syncState !== 'idle' && (
        <Card title="Détail de la synchronisation">
          <ol className="space-y-3">
            {SYNC_STEPS.map((step, idx) => {
              const stateOrder: SyncState[] = ['scanning', 'connecting', 'transferring', 'done'];
              const currentIdx  = stateOrder.indexOf(syncState);
              const isDone      = idx < currentIdx || syncState === 'done';
              const isActive    = stateOrder[idx] === syncState;

              return (
                <li key={step.state} className="flex items-center gap-3">
                  {isDone ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${isDone ? 'text-green-700' : isActive ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      {/* Note technique */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm">
        <WifiOff className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
        <div>
          <p className="font-medium text-slate-700">Mode hors-ligne</p>
          <p className="mt-0.5">
            Cette fonctionnalité nécessite un appareil compatible BLE (Bluetooth Low Energy)
            et une connexion HTTPS. En l'absence de connexion, les ventes et réservations sont
            conservées localement et synchronisées dès que possible.
          </p>
        </div>
      </div>
    </div>
  );
}
