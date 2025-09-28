
import React, { useMemo, useState, useCallback } from 'react';
import type { SavedProject, ChangeRequest } from '../utils/types';
import { exportElementAsPdf, exportDataAsCsv } from '../utils/export';
import ExportDropdown from './ExportDropdown';
import { formatDate } from '../utils/formatters';

interface ProjectListProps {
    projects: SavedProject[];
    changeRequests: ChangeRequest[];
    onView: (id: string) => void;
    onDelete: (id: string) => void;
    onNewProject: () => void;
}

const KpiCard = ({ title, value }: { title: string, value: string }) => (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-primary mt-1">{value}</p>
    </div>
);


const ProjectList: React.FC<ProjectListProps> = ({ projects, changeRequests, onView, onDelete, onNewProject }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof SavedProject | 'exposureBefore' | 'exposureAfter' | 'upcomingDeadlines6Months'; direction: 'ascending' | 'descending' }>({ key: 'savedAt', direction: 'descending' });


    const calculateProjectKpis = useCallback((project: SavedProject) => {
        const risks = project.risks || [];
        const deadlines = project.deadlines || [];
    
        const exposureBefore = risks.reduce((acc, risk) => {
            const cost = risk.coutProbableMaximal || 0;
            const probability = risk.probabiliteAvant || 0;
            return acc + (cost * (probability / 100));
        }, 0);
        const exposureAfter = risks.reduce((acc, risk) => {
            const cost = risk.coutProbableMaximal || 0;
            const probability = risk.probabiliteApres || 0;
            const mitigationCost = risk.coutMitigation || 0;
            return acc + (cost * (probability / 100)) + mitigationCost;
        }, 0);

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Compare dates only
        const sixMonthsFromNow = new Date(now);
        sixMonthsFromNow.setMonth(now.getMonth() + 6);
    
        const upcomingDeadlines6Months = deadlines.reduce((count, deadline) => {
            const dateToParse = deadline.date + 'T00:00:00';
            const deadlineDate = new Date(dateToParse);
            if (deadlineDate >= now && deadlineDate <= sixMonthsFromNow) {
                return count + 1;
            }
            return count;
        }, 0);

        return { exposureBefore, exposureAfter, upcomingDeadlines6Months };
    }, []);

    const sortedAndFilteredProjects = useMemo(() => {
        let filtered = projects.filter(p => 
            p.projectName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const sortableItems = filtered.map(p => ({
            ...p,
            ...calculateProjectKpis(p),
        }));
        
        sortableItems.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            if (sortConfig.key in a && sortConfig.key in b) {
                aValue = a[sortConfig.key as keyof typeof a];
                bValue = b[sortConfig.key as keyof typeof b];
            } else {
                 return 0;
            }
        
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            
            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortableItems;
    }, [projects, searchTerm, sortConfig, calculateProjectKpis]);

    const requestSort = (key: keyof SavedProject | 'exposureBefore' | 'exposureAfter' | 'upcomingDeadlines6Months') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: string) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    const globalKpis = useMemo(() => {
        let totalExposureBefore = 0;
        let totalExposureAfter = 0;

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Compare dates only, ignoring time

        projects.forEach(project => {
            (project.risks || []).forEach(risk => {
                const cost = risk.coutProbableMaximal || 0;
                const probaBefore = risk.probabiliteAvant || 0;
                totalExposureBefore += cost * (probaBefore / 100);
                const probaAfter = risk.probabiliteApres || 0;
                const mitigationCost = risk.coutMitigation || 0;
                totalExposureAfter += (cost * (probaAfter / 100)) + mitigationCost;
            });
        });
        
        const allDeadlines = projects.flatMap(p => 
            (p.deadlines || []).map(d => ({ ...d, projectName: p.projectName }))
        );

        const upcomingDeadlines = allDeadlines
            .filter(d => {
                const dateToParse = d.date + 'T00:00:00';
                const deadlineDate = new Date(dateToParse);
                return deadlineDate >= now;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);
            
        const totalChangeRequests = changeRequests.length;
        const pendingChanges = changeRequests.filter(cr => cr.status === 'Demandé' || cr.status === 'En Analyse').length;
        const totalCostImpact = changeRequests.reduce((acc, cr) => {
            if (cr.status === 'Approuvé' || cr.status === 'Implémenté') {
                return acc + (cr.estimatedCost || 0);
            }
            return acc;
        }, 0);

        const changesWithCost = changeRequests.filter(c => c.estimatedCost && c.estimatedCost > 0);
        const averageChangeCost = changesWithCost.length > 0 
            ? changesWithCost.reduce((acc, c) => acc + (c.estimatedCost || 0), 0) / changesWithCost.length 
            : 0;

        return {
            totalProjects: projects.length,
            totalExposureBefore,
            totalExposureAfter,
            upcomingDeadlines,
            totalChangeRequests,
            pendingChanges,
            totalCostImpact,
            averageChangeCost
        };
    }, [projects, changeRequests]);
    
    const formatCurrency = useCallback((value: number, digits = 0) => {
        if (isNaN(value) || !isFinite(value)) return 'N/A';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
    }, []);

    const handlePdfExport = () => {
        exportElementAsPdf(
            'project-list-export-area',
            'helexia_liste_projets.pdf',
            '.export-actions, .export-actions-col'
        );
    };

    const handleExcelExport = () => {
        const dataToExport = sortedAndFilteredProjects.map(project => {
            return {
                'Nom du projet': project.projectName,
                'Statut': project.status,
                'Exposition (Avant Mitigation) (€)': project.exposureBefore,
                'Exposition (Après Mitigation) (€)': project.exposureAfter,
                'Échéances < 6 mois': project.upcomingDeadlines6Months,
                'Date de sauvegarde': formatDate(project.savedAt),
            };
        });
        exportDataAsCsv(dataToExport, 'helexia_liste_projets.csv');
    };

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-primary mb-4">Tableau de bord</h2>
                <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <KpiCard title="Projets Actifs" value={globalKpis.totalProjects.toString()} />
                      <KpiCard title="Exposition Totale (Brute)" value={formatCurrency(globalKpis.totalExposureBefore)} />
                      <KpiCard title="Exposition Résiduelle" value={formatCurrency(globalKpis.totalExposureAfter)} />
                      <KpiCard title="Impact Financier Moyen / Changement" value={formatCurrency(globalKpis.averageChangeCost)} />
                      <KpiCard title="Demandes de Changement" value={globalKpis.totalChangeRequests.toString()} />
                      <KpiCard title="Changements en Attente" value={globalKpis.pendingChanges.toString()} />
                      <KpiCard title="Impact Financier (Changements)" value={formatCurrency(globalKpis.totalCostImpact)} />
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-primary mb-2">Prochaines Échéances</h3>
                    {globalKpis.upcomingDeadlines.length > 0 ? (
                      <ul className="space-y-2">
                        {globalKpis.upcomingDeadlines.map(d => (
                          <li key={d.id} className="text-sm p-2 bg-gray-50 rounded">
                            <p className="font-semibold">{d.description}</p>
                            <p className="text-xs text-gray-500">{d.projectName} - Échéance le {formatDate(d.date)}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 text-center pt-8">Aucune échéance à venir.</p>
                    )}
                  </div>
                </div>
            </div>

            <div id="project-list-export-area">
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-primary">Suivi des Projets</h2>
                            <div className="flex items-center space-x-3 export-actions">
                                <ExportDropdown
                                    onPdfExport={handlePdfExport}
                                    onExcelExport={handleExcelExport}
                                    disabled={projects.length === 0}
                                />
                                <button 
                                    onClick={onNewProject}
                                    className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                                >
                                    + Nouveau Projet
                                </button>
                            </div>
                        </div>
                        <div className="mt-4">
                            <input
                                type="text"
                                placeholder="Rechercher un projet par nom..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full max-w-xs p-2 border border-gray-300 rounded-md bg-white focus:ring-secondary focus:border-secondary"
                            />
                        </div>
                    </div>

                    {projects.length === 0 ? (
                        <div className="text-center text-gray-500 py-16">
                            <h3 className="text-lg font-semibold">Aucun projet sauvegardé</h3>
                            <p className="mt-1">Commencez par créer un nouveau projet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="bg-gray-50 text-xs text-primary font-semibold uppercase">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('projectName')}>
                                            Nom du projet{getSortIndicator('projectName')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('status')}>
                                            Statut{getSortIndicator('status')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right cursor-pointer" onClick={() => requestSort('exposureBefore')}>
                                            Exposition (Avant Mitigation){getSortIndicator('exposureBefore')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right cursor-pointer" onClick={() => requestSort('exposureAfter')}>
                                            Exposition (Après Mitigation){getSortIndicator('exposureAfter')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center cursor-pointer" onClick={() => requestSort('upcomingDeadlines6Months')}>
                                            Échéances &lt; 6 mois{getSortIndicator('upcomingDeadlines6Months')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('savedAt')}>
                                            Date de sauvegarde{getSortIndicator('savedAt')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedAndFilteredProjects.map(project => {
                                        return (
                                            <tr key={project.id} className="bg-white border-b hover:bg-gray-50">
                                                <th scope="row" className="px-6 py-4 font-semibold text-primary whitespace-nowrap">
                                                    {project.projectName}
                                                </th>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{project.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium">
                                                    {formatCurrency(project.exposureBefore)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-green-700">
                                                    {formatCurrency(project.exposureAfter)}
                                                </td>
                                                <td className="px-6 py-4 text-center font-medium">
                                                    {project.upcomingDeadlines6Months > 0 ? (
                                                        <span className="text-orange-600 font-bold">{project.upcomingDeadlines6Months}</span>
                                                    ) : (
                                                        <span>{project.upcomingDeadlines6Months}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {formatDate(project.savedAt)}
                                                </td>
                                                <td className="px-6 py-4 text-center space-x-3">
                                                    <button onClick={() => onView(project.id)} className="font-semibold text-secondary hover:underline">Voir/Modifier</button>
                                                    <button onClick={() => onDelete(project.id)} className="font-semibold text-red-600 hover:underline">Supprimer</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectList;