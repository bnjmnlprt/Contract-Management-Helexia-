
import React from 'react';
import type { Dispute } from '../utils/types';

interface DisputeDashboardProps {
  disputes: Dispute[];
  onSelectDispute: (dispute: Dispute) => void;
  onNewDispute: () => void;
}

const DisputeDashboard: React.FC<DisputeDashboardProps> = ({ disputes, onSelectDispute, onNewDispute }) => {
  // KPIs calculés à partir des données
  const openDisputes = disputes.filter(d => d.status !== 'Résolu' && d.status !== 'Clos');
  const totalAmount = disputes.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">Tableau de Bord des Litiges</h2>
        <button
            onClick={onNewDispute}
            className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
        >
            + Déclarer un nouveau litige
        </button>
      </div>

      {/* Section des KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total des litiges</p>
          <p className="text-2xl font-bold text-primary">{disputes.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Montant total en jeu</p>
          <p className="text-2xl font-bold text-primary">{totalAmount.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Taux de résolution</p>
          <p className="text-2xl font-bold text-primary">
            {disputes.length > 0 ? Math.round((disputes.filter(d => d.status === 'Résolu').length / disputes.length) * 100) : 0}%
          </p>
        </div>
      </div>
      {/* Tableau des litiges ouverts */}
      <div className="bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 p-4">Litiges Ouverts</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-primary uppercase">
                    <tr>
                        <th className="px-4 py-3">Contrat Concerné</th>
                        <th className="px-4 py-3">Titre du Litige</th>
                        <th className="px-4 py-3">Statut</th>
                        <th className="px-4 py-3">Montant en jeu</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {openDisputes.map(d => (
                        <tr key={d.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-primary">{d.relatedContract}</td>
                            <td className="px-4 py-3">{d.title}</td>
                            <td className="px-4 py-3">{d.status}</td>
                            <td className="px-4 py-3">{d.amount ? `${d.amount.toLocaleString('fr-FR')} €` : '-'}</td>
                            <td className="px-4 py-3 text-center">
                                <button onClick={() => onSelectDispute(d)} className="font-semibold text-secondary hover:underline">Voir/Modifier</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {openDisputes.length === 0 && (
            <div className="text-center py-10 text-gray-500">
                <p>Aucun litige ouvert.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default DisputeDashboard;
