
import React from 'react';
import type { Dispute } from '../utils/types';
import { formatDate } from '../utils/formatters';

interface DisputeDetailPageProps {
  dispute: Dispute | null;
  onBack: () => void;
  onEdit: (dispute: Dispute) => void;
}

const DetailItem = ({ label, value }: { label: string; value: string | number | undefined | null }) => (
    <div className="mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-800 break-words">{value || 'N/A'}</p>
    </div>
);

const DisputeDetailPage: React.FC<DisputeDetailPageProps> = ({ dispute, onBack, onEdit }) => {
    if (!dispute) {
        return (
            <div>
                <button onClick={onBack} className="text-sm text-secondary hover:underline mb-4">← Retour</button>
                <p>Aucun litige sélectionné.</p>
            </div>
        );
    }

    const formatAmount = (value: number | null | undefined) => {
        if (value === null || value === undefined) return 'N/A';
        return `${value.toLocaleString('fr-FR')} €`;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="text-sm text-secondary hover:underline">← Retour au tableau de bord</button>
                <div className="flex space-x-2">
                     <button onClick={() => onEdit(dispute)} className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-opacity-90">
                        Éditer le dossier
                    </button>
                    <button onClick={onBack} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Fermer
                    </button>
                </div>
            </div>

            {/* En-tête principal */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-primary">{dispute.title}</h2>
                        <p className="text-sm text-gray-500">Contrat de référence : {dispute.relatedContract}</p>
                    </div>
                     <span className={`px-3 py-1 text-sm font-semibold rounded-full ${dispute.status === 'En cours' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{dispute.status}</span>
                </div>
                
                <div className="border-t pt-4">
                    <h3 className="font-semibold text-primary mb-2">Description</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border">{dispute.description || 'Non renseigné'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4 border-t pt-4">
                    <div>
                        <DetailItem label="SPV" value={dispute.spv} />
                        <DetailItem label="Date de la cause du litige" value={formatDate(dispute.incidentDate)} />
                        <DetailItem label="Responsable du dossier" value={dispute.manager} />
                    </div>
                    <div>
                        <DetailItem label="Adresse" value={dispute.address} />
                        <DetailItem label="Date d'ouverture" value={formatDate(dispute.startDate)} />
                    </div>
                </div>

                {/* Section Finances */}
                <div className="mt-4 border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Finances</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailItem label="Montant évaluation du dommage" value={formatAmount(dispute.quoteAmount)} />
                        <DetailItem label="Remboursement" value={formatAmount(dispute.reimbursement)} />
                    </div>
                </div>

                {/* Section Expertise & Suivi */}
                <div className="mt-4 border-t pt-4">
                     <h3 className="text-lg font-semibold text-gray-800 mb-3">Expertise & Suivi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <div>
                            <DetailItem label="Conseil" value={dispute.expert} />
                            <DetailItem label="Date dernier suivi" value={formatDate(dispute.lastFollowUpDate)} />
                            <DetailItem label="No. dossier Conseil" value={dispute.insurerRef} />
                        </div>
                        <div>
                            <DetailItem label="Date Prochaine étape" value={formatDate(dispute.expertiseDate)} />
                            <DetailItem label="Prochain Suivi" value={formatDate(dispute.nextFollowUpDate)} />
                             <DetailItem label="Lien SharePoint" value={dispute.sharepointLink} />
                        </div>
                    </div>
                </div>
                
                {/* Détails du Suivi */}
                <div className="mt-4 border-t pt-4">
                     <h3 className="text-lg font-semibold text-gray-800 mb-3">Détails du Suivi</h3>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                       <p className="text-sm text-blue-900 whitespace-pre-wrap">{dispute.followUpDetails || 'Non renseigné'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DisputeDetailPage;