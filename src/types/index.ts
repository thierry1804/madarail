export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent' | 'controller';
  /** Nom de la ville/gare d'affectation — correspond à TrainRoute.departure */
  gare?: string;
  createdAt: string;
}

export interface TrainRoute {
  id: string;
  name: string;
  /** Service commercial : "Train voyageur", "Micheline « Viko Viko »", "Trans Lémurie Express" */
  serviceName?: string;
  /** Jours d'exploitation affichés au guichet (ex. "Dimanche, Jeudi") */
  operatingDays?: string;
  departure: string;
  arrival: string;
  /** Ligne : TCE (Tana–Côte Est), TA (Tana–Antsirabe), MOR (Moramanga–Ambila) */
  category: string;
  classe: '1ère classe' | '2ème classe' | '3ème classe';
  price: number;
  seatsAvailable: number;
  trainNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
}

export interface TicketItem {
  route: TrainRoute;
  quantity: number;
  passengerFirstName: string;
  passengerLastName: string;
  passengerCIN: string;
  travelDate: string;
  /** Numéro de siège — renseigné uniquement pour les réservations */
  seatNumber?: string;
}

export type PaymentMethod = 'mvola' | 'orange_money' | 'airtel_money';

export interface Sale {
  id: string;
  items: TicketItem[];
  total: number;
  subtotal: number;
  tax: number;
  paymentMethod: PaymentMethod;
  agentId: string;
  agentName: string;
  gare: string;
  createdAt: string;
}

export type SeatStatus = 'free' | 'reserved' | 'selected' | 'no_show';

export interface Seat {
  number: string;
  row: number;
  column: 'A' | 'B' | 'C' | 'D';
  status: SeatStatus;
}

export interface SeatMapConfig {
  trainServiceName: string;
  totalSeats: number;
  rows: number;
}

export interface Reservation {
  id: string;
  routeId: string;
  route: TrainRoute;
  seatNumber: string;
  passengerFirstName: string;
  passengerLastName: string;
  passengerCIN: string;
  travelDate: string;
  paymentMethod: PaymentMethod;
  total: number;
  subtotal: number;
  tax: number;
  agentId: string;
  agentName: string;
  gare: string;
  status: 'confirmed' | 'no_show' | 'reassigned';
  createdAt: string;
  reassignedTo?: {
    passengerFirstName: string;
    passengerLastName: string;
    passengerCIN: string;
    agentId: string;
    reassignedAt: string;
  };
}

export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  averageTicket: number;
  topRoutes: Array<{
    route: TrainRoute;
    quantity: number;
    revenue: number;
  }>;
}
