export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent';
  gareId?: string;
  createdAt: string;
}

export interface TrainRoute {
  id: string;
  name: string;
  departure: string;
  arrival: string;
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
  passengerName: string;
  travelDate: string;
}

export interface Sale {
  id: string;
  items: TicketItem[];
  total: number;
  subtotal: number;
  tax: number;
  paymentMethod: 'cash' | 'card' | 'mobile_money';
  agentId: string;
  agentName: string;
  gareId: string;
  createdAt: string;
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
