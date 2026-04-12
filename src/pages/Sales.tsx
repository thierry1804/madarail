import { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Sale } from '../types';
import { formatAriary } from '../utils/format';

const PAYMENT_LABELS: Record<string, string> = {
  mvola:        'MVola',
  orange_money: 'Orange Money',
  airtel_money: 'Airtel Money',
};

function getPaymentLabel(method: string): string {
  return PAYMENT_LABELS[method] || method;
}

export function Sales() {
  const { sales } = useApp();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const exportToCSV = () => {
    const headers = [
      'ID', 'Date', 'Agent', 'Gare',
      'Prénom passager', 'Nom passager', 'CIN passager',
      'Trajet', 'Sous-total', 'TVA', 'Total', 'Paiement',
    ];

    const rows = sales.flatMap(sale =>
      sale.items.map(item => [
        sale.id,
        new Date(sale.createdAt).toLocaleString('fr-FR'),
        sale.agentName,
        sale.gare,
        item.passengerFirstName,
        item.passengerLastName,
        item.passengerCIN,
        `${item.route.departure} → ${item.route.arrival}`,
        sale.subtotal,
        sale.tax,
        sale.total,
        sale.paymentMethod,
      ])
    );

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `billets-madarail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Historique des ventes</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">{sales.length} transaction(s)</p>
        </div>
        <Button
          onClick={exportToCSV}
          className="flex w-full shrink-0 items-center justify-center gap-2 sm:w-auto !bg-madarail-red hover:!bg-madarail-red-dark"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <p className="text-sm text-gray-600 mb-1">Total des ventes</p>
          <p className="text-xl font-bold text-madarail-red">
            {formatAriary(sales.reduce((sum, s) => sum + s.total, 0))}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">Panier moyen</p>
          <p className="text-xl font-bold text-gray-900">
            {formatAriary(sales.length > 0 ? sales.reduce((sum, s) => sum + s.total, 0) / sales.length : 0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600 mb-1">TVA collect&eacute;e</p>
          <p className="text-xl font-bold text-gray-900">
            {formatAriary(sales.reduce((sum, s) => sum + s.tax, 0))}
          </p>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-gray-50">
              <tr>
                {['ID', 'Date & Heure', 'Agent', 'Gare', 'Billets', 'Total', 'Paiement', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Aucune vente enregistr&eacute;e
                  </td>
                </tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 font-mono">{sale.id}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{new Date(sale.createdAt).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{sale.agentName}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{sale.gare}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatAriary(sale.total)}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-madarail-red-soft text-madarail-navy">
                        {getPaymentLabel(sale.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <button onClick={() => setSelectedSale(sale)} className="text-madarail-red hover:text-madarail-red-dark">
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modale détail */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <Card className="w-full max-w-2xl max-h-[90dvh] sm:max-h-[90vh] overflow-auto rounded-t-2xl sm:rounded-xl pb-[env(safe-area-inset-bottom,0px)] sm:pb-0">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold">D&eacute;tails de la vente</h3>
                <p className="text-gray-600 font-mono text-sm">ID : {selectedSale.id}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-600">Date</p><p className="font-medium">{new Date(selectedSale.createdAt).toLocaleString('fr-FR')}</p></div>
                <div><p className="text-sm text-gray-600">Agent</p><p className="font-medium">{selectedSale.agentName}</p></div>
                <div><p className="text-sm text-gray-600">Gare / Arrêt</p><p className="font-medium">{selectedSale.gare}</p></div>
                <div><p className="text-sm text-gray-600">Opérateur</p><p className="font-medium">{getPaymentLabel(selectedSale.paymentMethod)}</p></div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Billets</h4>
                <div className="space-y-2">
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start bg-gray-50 p-3 rounded-lg">
                      <div className="min-w-0">
                        <p className="font-medium">{item.route.departure} → {item.route.arrival}</p>
                        <p className="text-sm text-gray-600">{item.route.classe} — Train {item.route.trainNumber}</p>
                        <p className="text-sm text-gray-500">
                          {item.passengerLastName} {item.passengerFirstName} — CIN : {item.passengerCIN}
                        </p>
                        <p className="text-sm text-gray-500">
                          Voyage : {new Date(item.travelDate).toLocaleDateString('fr-FR')}
                          {item.seatNumber && ` — Siège ${item.seatNumber}`}
                        </p>
                        <p className="text-sm text-gray-600">{formatAriary(item.route.price)} × {item.quantity}</p>
                      </div>
                      <p className="font-bold">{formatAriary(item.route.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600"><span>Sous-total</span><span>{formatAriary(selectedSale.subtotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>TVA (20 %)</span><span>{formatAriary(selectedSale.tax)}</span></div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-madarail-red">{formatAriary(selectedSale.total)}</span>
                </div>
              </div>
            </div>

            <Button onClick={() => setSelectedSale(null)} variant="secondary" className="w-full mt-6">Fermer</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
