
import React, { useState, useMemo } from 'react';
import type { ChangeRequest, SavedProject, PurchasingAction } from '../utils/types';
import ExportDropdown from './ExportDropdown';
import { exportElementAsPdf, exportDataAsCsv, exportChangeRequestAsPdf } from '../utils/export';
import { formatDate } from '../utils/formatters';

interface ChangeManagementModuleProps {
    changeRequests: ChangeRequest[];
    projects: SavedProject[];
    onNewRequest: () => void;
    onEditRequest: (req: ChangeRequest) => void;
    purchasingActions: PurchasingAction[];
}

const getStatusClasses = (status: ChangeRequest['status']) => {
    switch (status) {
        case 'Approuvé':
            return 'bg-green-100 text-green-800';
        case 'Rejeté':
            return 'bg-red-100 text-red-800';
        case 'En Analyse':
            return 'bg-yellow-100 text-yellow-800';
        case 'Implémenté':
            return 'bg-blue-100 text-blue-800';
        case 'Demandé':
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getPriorityClasses = (priority: ChangeRequest['priority']) => {
    switch (priority) {
        case 'Élevée':
            return 'bg-red-100 text-red-800';
        case 'Moyenne':
            return 'bg-orange-100 text-orange-800';
        case 'Faible':
        default:
            return 'bg-blue-100 text-blue-800';
    }
};

const ChangeManagementModule: React.FC<ChangeManagementModuleProps> = ({ changeRequests, projects, onNewRequest, onEditRequest, purchasingActions }) => {
    const [projectFilter, setProjectFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewingActionsFor, setViewingActionsFor] = useState<string | null>(null);

    const filteredRequests = useMemo(() => {
        return changeRequests.filter(req => {
            const projectMatch = projectFilter === 'all' || req.projectId === projectFilter;
            const statusMatch = statusFilter === 'all' || req.status === statusFilter;
            return projectMatch && statusMatch;
        });
    }, [changeRequests, projectFilter, statusFilter]);
    
    const handlePdfExport = () => {
        exportElementAsPdf('change-management-export-area', 'registre_changements.pdf', '.export-actions, .modal-actions');
    };

    const handleExcelExport = () => {
        const dataToExport = filteredRequests.map(req => ({
            'ID': req.id,
            'Titre': req.title,
            'Projet': req.projectName,
            'Demandeur': req.requester,
            'Statut': req.status,
            'Date de Création': formatDate(req.createdAt)
        }));
        exportDataAsCsv(dataToExport, 'export_registre_changements.csv');
    };

    return (
        <>
            <div id="change-management-export-area" className="bg-white rounded-lg shadow-md">
                <div className="p-6 flex justify-between items-center border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-primary">Gestion du Changement</h2>
                    <div className="flex items-center space-x-3 export-actions">
                        <ExportDropdown
                            onPdfExport={handlePdfExport}
                            onExcelExport={handleExcelExport}
                            disabled={filteredRequests.length === 0}
                        />
                        <button 
                            onClick={onNewRequest}
                            className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                        >
                            + Nouvelle Demande
                        </button>
                    </div>
                </div>

                {/* Section des Filtres */}
                <div className="flex items-end space-x-4 p-4 bg-white border-b">
                    <div>
                        <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700">Filtrer par projet</label>
                        <select id="project-filter" value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm rounded-md bg-gray-50 text-gray-800">
                            <option value="all">Tous les projets</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Filtrer par statut</label>
                        <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm rounded-md bg-gray-50 text-gray-800">
                            <option value="all">Tous les statuts</option>
                            <option>Demandé</option>
                            <option>En Analyse</option>
                            <option>Approuvé</option>
                            <option>Rejeté</option>
                            <option>Implémenté</option>
                        </select>
                    </div>
                </div>

                {changeRequests.length === 0 ? (
                    <div className="text-center text-gray-500 py-16">
                    <h3 className="text-lg font-semibold">Aucune demande de changement enregistrée</h3>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="bg-gray-50 text-xs text-primary font-semibold uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">Titre de la Demande</th>
                                <th scope="col" className="px-6 py-3">Projet Associé</th>
                                <th scope="col" className="px-6 py-3">Demandeur</th>
                                <th scope="col" className="px-6 py-3">Statut</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions d'Achat</th>
                                <th scope="col" className="px-6 py-3">Date de Création</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredRequests.map(req => {
                                const associatedActions = purchasingActions.filter(action => action.changeRequestId === req.id);
                                const hasActions = associatedActions.length > 0;
                                const isViewing = viewingActionsFor === req.id;

                                return (
                                    <React.Fragment key={req.id}>
                                        <tr className="bg-white border-b hover:bg-gray-50">
                                            <th scope="row" className="px-6 py-4 font-semibold text-primary">{req.title}</th>
                                            <td className="px-6 py-4">{req.projectName}</td>
                                            <td className="px-6 py-4">{req.requester}</td>
                                            <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(req.status)}`}>{req.status}</span></td>
                                            <td className="px-6 py-4 text-center">
                                                {hasActions ? (
                                                    <button 
                                                        onClick={() => setViewingActionsFor(isViewing ? null : req.id)}
                                                        className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        aria-expanded={isViewing}
                                                    >
                                                        {isViewing ? 'Masquer' : 'Voir'} ({associatedActions.length})
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">{formatDate(req.createdAt)}</td>
                                            <td className="px-6 py-4 text-center space-x-3">
                                                <button onClick={() => onEditRequest(req)} className="font-semibold text-secondary hover:underline">Voir/Modifier</button>
                                                <button onClick={() => exportChangeRequestAsPdf(req)} className="font-semibold text-blue-600 hover:underline">Exporter PDF</button>
                                            </td>
                                        </tr>
                                        {isViewing && hasActions && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={7} className="p-4">
                                                    <div className="p-3 bg-white rounded-md border border-blue-200">
                                                        <h4 className="font-semibold text-sm text-primary mb-2">Actions d'achat pour "{req.title}"</h4>
                                                        <ul className="space-y-2 list-disc list-inside text-sm">
                                                            {associatedActions.map(action => (
                                                                <li key={action.id}>
                                                                    <span className="font-medium">{action.actionDescription}</span>
                                                                    <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                                        action.status === 'Terminé' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                        {action.status}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            </tbody>
                        </table>
                        {filteredRequests.length === 0 && (
                            <div className="text-center text-gray-500 py-16">
                                <h3 className="text-lg font-semibold">Aucune demande ne correspond aux filtres</h3>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default ChangeManagementModule;
