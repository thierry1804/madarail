import { TrendingUp, Ticket, Train } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Card } from '../components/Card';

function formatAriary(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' Ar';
}

export function Dashboard() {
  const { sales, routes } = useApp();

  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });

  const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = todaySales.length;
  const totalTickets = todaySales.reduce(
    (sum, sale) => sum + sale.items.reduce((s, item) => s + item.quantity, 0),
    0
  );
  const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const routeSales = todaySales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      const key = item.route.id;
      if (!acc[key]) {
        acc[key] = {
          route: item.route,
          quantity: 0,
          revenue: 0,
        };
      }
      acc[key].quantity += item.quantity;
      acc[key].revenue += item.route.price * item.quantity;
    });
    return acc;
  }, {} as Record<string, { route: typeof routes[0]; quantity: number; revenue: number }>);

  const topRoutes = Object.values(routeSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const paymentMethodsStats = todaySales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hourlyStats = todaySales.reduce((acc, sale) => {
    const hour = new Date(sale.createdAt).getHours();
    acc[hour] = (acc[hour] || 0) + sale.total;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-1">Madarail Madagascar - Vue d'ensemble</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Recettes du jour</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAriary(totalRevenue)}
              </p>
            </div>
            <div className="bg-madarail-red-soft p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-madarail-red" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-green-600 font-medium">+12.5%</span>
            <span className="text-gray-600 ml-2">vs hier</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Billets vendus</p>
              <p className="text-3xl font-bold text-gray-900">{totalTickets}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">{totalTransactions} transaction(s)</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Panier moyen</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAriary(averageTicket)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-green-600 font-medium">+3.1%</span>
            <span className="text-gray-600 ml-2">vs hier</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Trajets actifs</p>
              <p className="text-3xl font-bold text-gray-900">{routes.length}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Train className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {routes.filter(r => r.seatsAvailable < 10).length} presque complet(s)
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Trajets les plus vendus">
          {topRoutes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune vente aujourd'hui</p>
          ) : (
            <div className="space-y-4">
              {topRoutes.map((item, index) => (
                <div key={item.route.id} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-madarail-red-soft rounded-full flex items-center justify-center text-madarail-red font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.route.departure} → {item.route.arrival}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.route.classe} - {item.quantity} billet(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatAriary(item.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Modes de paiement">
          <div className="space-y-4">
            {Object.entries(paymentMethodsStats).length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune vente aujourd'hui</p>
            ) : (
              Object.entries(paymentMethodsStats).map(([method, count]) => {
                const total = Object.values(paymentMethodsStats).reduce((a, b) => a + b, 0);
                const percentage = (count / total) * 100;
                const labels: Record<string, string> = {
                  cash: 'Esp\u00e8ces',
                  card: 'Carte bancaire',
                  mobile_money: 'Mobile Money',
                };
                const colors: Record<string, string> = {
                  cash: 'bg-green-600',
                  card: 'bg-blue-600',
                  mobile_money: 'bg-orange-600',
                };

                return (
                  <div key={method}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {labels[method] || method}
                      </span>
                      <span className="text-gray-600">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colors[method] || 'bg-gray-600'} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <Card title="Ventes par heure">
        <div className="flex items-end gap-2 h-48">
          {Array.from({ length: 24 }, (_, i) => i).map(hour => {
            const value = hourlyStats[hour] || 0;
            const maxValue = Math.max(...Object.values(hourlyStats), 1);
            const height = (value / maxValue) * 100;

            return (
              <div key={hour} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-madarail-red rounded-t hover:bg-madarail-red-dark transition-colors cursor-pointer"
                  style={{ height: `${height}%` }}
                  title={`${hour}h: ${formatAriary(value)}`}
                />
                <span className="text-xs text-gray-600 mt-2">{hour}h</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
