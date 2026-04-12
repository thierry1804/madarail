import { Seat, SeatMapConfig } from '../types';

interface SeatButtonProps {
  seat: Seat;
  isSelected: boolean;
  onSelect: (seatNumber: string) => void;
}

function SeatButton({ seat, isSelected, onSelect }: SeatButtonProps) {
  const isFree     = seat.status === 'free';
  const isReserved = seat.status === 'reserved' || seat.status === 'no_show';

  let cls = '';
  if (isSelected)      cls = 'bg-madarail-red border-madarail-red-dark text-white shadow-md scale-105';
  else if (isReserved) cls = 'bg-slate-300 border-slate-400 text-slate-500 cursor-not-allowed';
  else                 cls = 'bg-emerald-100 border-emerald-400 text-emerald-800 hover:bg-emerald-200 hover:border-emerald-500 cursor-pointer';

  return (
    <button
      type="button"
      disabled={!isFree && !isSelected}
      onClick={() => isFree && onSelect(seat.number)}
      title={`Siège ${seat.number}${isReserved ? ' (réservé)' : ''}`}
      className={`
        w-full aspect-square rounded-md border-2 text-[10px] font-bold
        transition-all duration-100 select-none
        ${cls}
      `}
      aria-label={`Siège ${seat.number}`}
      aria-pressed={isSelected}
    >
      {seat.number}
    </button>
  );
}

interface SeatMapProps {
  seats: Seat[][];
  selectedSeat: string | null;
  onSeatSelect: (seatNumber: string) => void;
  config: SeatMapConfig;
}

export function SeatMap({ seats, selectedSeat, onSeatSelect, config }: SeatMapProps) {
  if (seats.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center py-6">
        Aucun plan disponible pour ce service.
      </p>
    );
  }

  return (
    <div className="select-none min-w-0">
      {/* Infos service */}
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
        <span className="font-semibold text-slate-700 truncate">{config.trainServiceName}</span>
        <span className="text-slate-500 shrink-0 text-xs sm:text-sm">{config.totalSeats} places · {config.rows} rangées</span>
      </div>

      {/* En-tête colonnes */}
      <div className="grid gap-1 mb-2 text-xs font-bold text-slate-400 text-center"
           style={{ gridTemplateColumns: '1.5rem 1fr 1fr 0.75rem 1fr 1fr' }}>
        <span />
        <span>A</span>
        <span>B</span>
        <span />
        <span>C</span>
        <span>D</span>
      </div>

      {/* Grille de sièges */}
      <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
        {seats.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="grid gap-1 items-center"
            style={{ gridTemplateColumns: '1.5rem 1fr 1fr 0.75rem 1fr 1fr' }}
          >
            {/* Numéro rangée */}
            <span className="text-[10px] text-slate-400 text-right pr-0.5 leading-none">
              {rowIdx + 1}
            </span>
            {/* Sièges A, B */}
            <SeatButton seat={row[0]} isSelected={selectedSeat === row[0].number} onSelect={onSeatSelect} />
            <SeatButton seat={row[1]} isSelected={selectedSeat === row[1].number} onSelect={onSeatSelect} />
            {/* Allée */}
            <div />
            {/* Sièges C, D */}
            <SeatButton seat={row[2]} isSelected={selectedSeat === row[2].number} onSelect={onSeatSelect} />
            <SeatButton seat={row[3]} isSelected={selectedSeat === row[3].number} onSelect={onSeatSelect} />
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded border-2 bg-emerald-100 border-emerald-400 inline-block" />
          Libre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded border-2 bg-madarail-red border-madarail-red-dark inline-block" />
          Sélectionné
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded border-2 bg-slate-300 border-slate-400 inline-block" />
          Réservé
        </span>
      </div>
    </div>
  );
}
