import { Seat, SeatMapConfig } from '../types';

/** Configuration des wagons par service commercial */
export const SEAT_MAP_CONFIGS: Record<string, SeatMapConfig> = {
  'Train voyageur': {
    trainServiceName: 'Train voyageur',
    totalSeats: 88,
    rows: 22,
  },
  'Trans Lémurie Express': {
    trainServiceName: 'Trans Lémurie Express',
    totalSeats: 52,
    rows: 13,
  },
  'Micheline « Viko Viko »': {
    trainServiceName: 'Micheline « Viko Viko »',
    totalSeats: 20,
    rows: 5,
  },
};

const COLUMN_LABELS = ['A', 'B', 'C', 'D'] as const;

/**
 * Génère la grille de sièges pour un service donné.
 * Layout 2+2 : colonnes A B | allée | C D
 * Numérotation : "1A", "1B", "1C", "1D", "2A"…
 *
 * @param serviceName  Correspond à TrainRoute.serviceName
 * @param reservedSeats  Numéros de sièges déjà bloqués (ex. ['1A', '3C'])
 */
export function buildSeatGrid(
  serviceName: string,
  reservedSeats: string[] = []
): Seat[][] {
  const config = SEAT_MAP_CONFIGS[serviceName];
  if (!config) return [];
  const reserved = new Set(reservedSeats);
  return Array.from({ length: config.rows }, (_, rowIdx) =>
    COLUMN_LABELS.map(col => ({
      number: `${rowIdx + 1}${col}`,
      row: rowIdx + 1,
      column: col,
      status: (reserved.has(`${rowIdx + 1}${col}`) ? 'reserved' : 'free') as Seat['status'],
    }))
  );
}

/** Retourne la config du service, ou undefined si non configuré */
export function getSeatMapConfig(serviceName?: string): SeatMapConfig | undefined {
  if (!serviceName) return undefined;
  return SEAT_MAP_CONFIGS[serviceName];
}
