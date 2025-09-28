
import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import type { RiskItem, MitigationAction } from '../utils/types';
import { exportElementAsPdf, exportDataAsCsv } from '../utils/export';
import ExportDropdown from './ExportDropdown';

// --- Helper & Icon Components ---
const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const PdfIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 12V4h12v10H4z" clipRule="evenodd" />
        <path d="M6 9a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm-1 4a1 1 0 100 2h8a1 1 0 100-2H5zM8 6a1 1 0 100-2 1 1 0 000 2z"/>
    </svg>
);

const CsvIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 12V4h12v10H4z" clipRule="evenodd" />
        <path d="M6 6h8v2H6V6zm0 4h8v2H6v-2zm0 4h5v2H6v-2z" />
    </svg>
);

// --- Custom Hook & Child Components ---

const useAutosizeTextArea = (textAreaRef: React.RefObject<HTMLTextAreaElement>, value: string) => {
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
        }
    }, [textAreaRef, value]);
};

interface RiskInputProps {
    label: string;
    value: string | number | null;
    onChange: (value: string | number) => void;
    type?: 'text' | 'number';
    unit?: string;
    placeholder?: string;
    className?: string;
}

const RiskInput: React.FC<RiskInputProps> = ({ label, value, onChange, type = 'text', unit, placeholder, className }) => (
    <div className={className}>
        <label className="block mb-1.5 text-sm font-medium text-gray-600">{label}</label>
        <div className="relative">
            <input
                type={type}
                value={value === null || value === undefined ? '' : value}
                onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:ring-1 focus:ring-secondary focus:border-secondary transition"
            />
            {unit && <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 text-sm">{unit}</span>}
        </div>
    </div>
);

interface RiskTextareaProps {
    label: string;
    value: string | null;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const RiskTextarea: React.FC<RiskTextareaProps> = ({ label, value, onChange, placeholder, className }) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    useAutosizeTextArea(textAreaRef, value || '');

    return (
        <div className={className}>
            <label className="block mb-1.5 text-sm font-medium text-gray-600">{label}</label>
            <textarea
                ref={textAreaRef}
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:ring-1 focus:ring-secondary focus:border-secondary transition resize-none"
            />
        </div>
    );
};

interface ResultCardProps {
    label: string;
    value: string;
    variant?: 'default' | 'mitigated';
}

const ResultCard: React.FC<ResultCardProps> = ({ label, value, variant = 'default' }) => {
    const bgColor = variant === 'default' ? 'bg-gray-100' : 'bg-green-50';
    const textColor = variant === 'default' ? 'text-primary' : 'text-green-800';
    const labelColor = variant === 'default' ? 'text-gray-500' : 'text-green-700';

    return (
        <div className={`mt-6 rounded-lg p-4 ${bgColor}`}>
            <p className={`text-sm font-medium ${labelColor}`}>{label}</p>
            <p className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</p>
        </div>
    );
};


interface RiskTableProps {
    projectRisks: RiskItem[];
    onRisksChange: (risks: RiskItem[]) => void;
    activeProjectName: string | undefined;
    onSuggestRisks: (contractType: string) => Promise<boolean>;
    isSuggesting: boolean;
}

const RiskTable: React.FC<RiskTableProps> = ({ projectRisks, onRisksChange, activeProjectName, onSuggestRisks, isSuggesting }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [contractType, setContractType] = useState<'EPC' | 'IPP Autoconsommation' | 'SEED EPC'>('EPC');
    const [suggestionError, setSuggestionError] = useState<string | null>(null);

    const formatCurrency = useCallback((value: number | null | undefined) => {
        if (value === null || value === undefined || isNaN(value)) return 'N/A';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(value);
    }, []);

    const handleUpdateRisk = (index: number, field: keyof RiskItem, value: any) => {
        const newRisks = [...projectRisks];
        (newRisks[index] as any)[field] = value;
        onRisksChange(newRisks);
    };

    const handleAddRisk = () => {
        onRisksChange([...projectRisks, {
            uid: `risk-${Date.now()}`,
            id: `R${(projectRisks.length + 1).toString().padStart(3, '0')}`,
            projet: activeProjectName || '',
            risque: '',
            typeRisque: '',
            description: '',
            coutProbableMaximal: null,
            probabiliteAvant: null,
            explicationCalcul: '',
            mitigationActions: [],
            coutMitigation: null,
            probabiliteApres: null,
        }]);
    };

    const handleDeleteRisk = (index: number) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce risque ?')) {
            const newRisks = projectRisks.filter((_, i) => i !== index);
            onRisksChange(newRisks);
        }
    };
    
    const handleGenerateSuggestions = async () => {
        setSuggestionError(null);
        const success = await onSuggestRisks(contractType);
        if (success) {
            setIsModalOpen(false);
        } else {
            setSuggestionError("Une erreur de connexion est survenue. Veuillez réessayer.");
        }
    };

    const handleAddMitigationAction = (riskIndex: number) => {
        const newRisks = [...projectRisks];
        const risk = newRisks[riskIndex];
        risk.mitigationActions.push({
            id: `action-${Date.now()}`,
            description: '',
            dueDate: null,
            status: 'À Faire'
        });
        onRisksChange(newRisks);
    };

    const handleUpdateMitigationAction = (riskIndex: number, actionIndex: number, field: keyof MitigationAction, value: any) => {
        const newRisks = [...projectRisks];
        const action = newRisks[riskIndex].mitigationActions[actionIndex];
        (action as any)[field] = value;
        onRisksChange(newRisks);
    };

    const handleDeleteMitigationAction = (riskIndex: number, actionIndex: number) => {
        const newRisks = [...projectRisks];
        newRisks[riskIndex].mitigationActions.splice(actionIndex, 1);
        onRisksChange(newRisks);
    };

    const calculatedRisks = useMemo(() => projectRisks.map(r => {
        const coutProbableAvant = (r.coutProbableMaximal || 0) * ((r.probabiliteAvant || 0) / 100);
        const coutProbableApres = ((r.coutProbableMaximal || 0) * ((r.probabiliteApres || 0) / 100)) + (r.coutMitigation || 0);
        return { ...r, coutProbableAvant, coutProbableApres };
    }), [projectRisks]);

    const handleSingleRiskExport = (risk: typeof calculatedRisks[0], format: 'pdf' | 'csv') => {
        const fileName = `helexia_risque_${risk.id}_${activeProjectName?.replace(/\s+/g, '_') || 'global'}`;

        if (format === 'csv') {
            const riskData = {
                'ID': risk.id,
                'Projet': risk.projet,
                'Risque': risk.risque,
                'Type risque': risk.typeRisque,
                'Description du risque': risk.description,
                'Cout probable maximal (€)': risk.coutProbableMaximal,
                'Probabilité avant mitigation (%)': risk.probabiliteAvant,
                'Cout probable avant mitigation (€)': risk.coutProbableAvant,
                'Explication - Calcul': risk.explicationCalcul,
                'Mitigation': risk.mitigationActions.map(a => a.description).join('; '),
                'Cout de mitigation (€)': risk.coutMitigation,
                'Probabilité après mitigation (%)': risk.probabiliteApres,
                'Cout probable après mitigation (€)': risk.coutProbableApres,
            };
            exportDataAsCsv([riskData], `${fileName}.csv`);
        } else {
            exportElementAsPdf(`risk-card-${risk.uid}`, `${fileName}.pdf`, '.export-actions');
        }
    };


    const handlePdfExport = () => {
        exportElementAsPdf(
            'risk-table-export-area',
            `helexia_tableau_risques_${activeProjectName?.replace(/\s+/g, '_') || 'global'}.pdf`,
            '.export-actions'
        );
    };

    const handleExcelExport = () => {
        const dataToExport = calculatedRisks.map(risk => ({
            'ID': risk.id,
            'Projet': risk.projet,
            'Risque': risk.risque,
            'Type risque': risk.typeRisque,
            'Description du risque': risk.description,
            'Cout probable maximal (€)': risk.coutProbableMaximal,
            'Probabilité avant mitigation (%)': risk.probabiliteAvant,
            'Cout probable avant mitigation (€)': risk.coutProbableAvant,
            'Explication - Calcul': risk.explicationCalcul,
            'Mitigation': risk.mitigationActions.map(a => a.description).join('; '),
            'Cout de mitigation (€)': risk.coutMitigation,
            'Probabilité après mitigation (%)': risk.probabiliteApres,
            'Cout probable après mitigation (€)': risk.coutProbableApres,
        }));
        
        exportDataAsCsv(dataToExport, `helexia_tableau_risques_${activeProjectName?.replace(/\s+/g, '_') || 'global'}.csv`);
    };

    return (
        <div>
            <div className="bg-white rounded-lg shadow-md mb-8">
                 <div className="p-6 flex justify-between items-center border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-primary">Tableau de suivi des Risques</h2>
                        {activeProjectName ? (
                           <p className="text-sm text-gray-500 mt-1">Projet : <span className="font-semibold">{activeProjectName}</span></p>
                        ) : (
                           <p className="text-sm text-red-500 mt-1">Veuillez sélectionner ou créer un projet pour gérer les risques.</p>
                        )}
                    </div>
                    <div className="flex items-center space-x-3 export-actions">
                        <ExportDropdown
                            onPdfExport={handlePdfExport}
                            onExcelExport={handleExcelExport}
                            disabled={projectRisks.length === 0}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setSuggestionError(null);
                                setIsModalOpen(true);
                            }}
                            disabled={!activeProjectName}
                            className="px-4 py-2 text-sm font-medium text-secondary border border-secondary rounded-md hover:bg-secondary/10 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Suggérer des risques
                        </button>
                         <button 
                            onClick={handleAddRisk}
                            disabled={!activeProjectName}
                            className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            + Ajouter un risque
                        </button>
                    </div>
                </div>
            </div>

            <div id="risk-table-export-area" className="space-y-6">
                {calculatedRisks.map((risk, index) => (
                     <div key={risk.uid} id={`risk-card-${risk.uid}`} className="bg-white rounded-lg shadow-md p-6 lg:p-8 relative">
                        <div className="absolute top-4 right-4 flex items-center gap-1 export-actions">
                            <button onClick={() => handleSingleRiskExport(risk, 'pdf')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100/50 rounded-full transition-colors" title="Exporter ce risque en PDF">
                                <PdfIcon />
                            </button>
                             <button onClick={() => handleSingleRiskExport(risk, 'csv')} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-100/50 rounded-full transition-colors" title="Exporter ce risque en CSV">
                                <CsvIcon />
                            </button>
                            <button onClick={() => handleDeleteRisk(index)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100/50 rounded-full transition-colors" title="Supprimer le risque">
                                <TrashIcon />
                            </button>
                        </div>

                        {/* --- Section 1: Identification --- */}
                        <div className="border-b border-gray-200 pb-6 mb-6">
                            <div className="flex items-start gap-4">
                                <RiskInput label="ID" value={risk.id} onChange={v => handleUpdateRisk(index, 'id', v as string)} className="w-24" />
                                <RiskInput label="Risque" value={risk.risque} onChange={v => handleUpdateRisk(index, 'risque', v as string)} placeholder="Nom du risque" className="flex-grow"/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4">
                                <RiskInput label="Projet" value={risk.projet} onChange={v => handleUpdateRisk(index, 'projet', v as string)} placeholder="Nom du projet" />
                                <RiskInput label="Type de risque" value={risk.typeRisque} onChange={v => handleUpdateRisk(index, 'typeRisque', v as string)} placeholder="Type" />
                            </div>
                            <RiskTextarea label="Description du risque" value={risk.description} onChange={v => handleUpdateRisk(index, 'description', v as string)} placeholder="Description détaillée du risque..." className="mt-4" />
                        </div>

                        {/* --- Section 2: Évaluation & Mitigation --- */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-12">
                            {/* LEFT: AVANT MITIGATION */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Évaluation Initiale</h3>
                                <div className="space-y-4">
                                    <RiskInput label="Coût probable maximal" type="number" value={risk.coutProbableMaximal} onChange={v => handleUpdateRisk(index, 'coutProbableMaximal', v as number)} unit="€" placeholder="0.00" />
                                    <RiskInput label="Probabilité avant mitigation" type="number" value={risk.probabiliteAvant} onChange={v => handleUpdateRisk(index, 'probabiliteAvant', v as number)} unit="%" placeholder="0" />
                                    <RiskTextarea label="Explication - Calcul" value={risk.explicationCalcul} onChange={v => handleUpdateRisk(index, 'explicationCalcul', v as string)} placeholder="Détails du calcul..." />
                                </div>
                                <ResultCard label="Coût probable avant mitigation" value={formatCurrency(risk.coutProbableAvant)} />
                            </div>

                             {/* RIGHT: PLAN DE MITIGATION */}
                            <div className="mt-8 lg:mt-0">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Plan de Mitigation</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-600">Actions de mitigation</label>
                                        <div className="space-y-3">
                                            {(risk.mitigationActions || []).map((action, actionIndex) => (
                                                <div key={action.id} className="p-3 border rounded-md bg-gray-50/50">
                                                    <div className="flex items-start gap-3">
                                                        <input 
                                                            type="checkbox"
                                                            checked={action.status === 'Terminé'}
                                                            onChange={e => handleUpdateMitigationAction(index, actionIndex, 'status', e.target.checked ? 'Terminé' : 'À Faire')}
                                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
                                                            aria-label={`Statut de l'action ${action.description}`}
                                                        />
                                                        <div className="flex-grow space-y-2">
                                                            <textarea
                                                                value={action.description}
                                                                onChange={e => handleUpdateMitigationAction(index, actionIndex, 'description', e.target.value)}
                                                                placeholder="Description de l'action..."
                                                                rows={2}
                                                                className={`w-full text-sm p-2 border rounded-md transition-colors ${action.status === 'Terminé' ? 'bg-gray-200 text-gray-500 line-through' : 'bg-white'}`}
                                                            />
                                                            <input
                                                                type="date"
                                                                value={action.dueDate || ''}
                                                                onChange={e => handleUpdateMitigationAction(index, actionIndex, 'dueDate', e.target.value)}
                                                                className="w-full text-xs p-2 border rounded-md bg-white"
                                                            />
                                                        </div>
                                                        <button type="button" onClick={() => handleDeleteMitigationAction(index, actionIndex)} className="text-gray-400 hover:text-red-600 p-1" title="Supprimer l'action">
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => handleAddMitigationAction(index)} 
                                            className="mt-3 px-3 py-1.5 text-xs font-semibold text-secondary border border-secondary rounded-md hover:bg-secondary/10 transition-colors">
                                            + Ajouter une action
                                        </button>
                                    </div>
                                     <RiskInput label="Coût de mitigation" type="number" value={risk.coutMitigation} onChange={v => handleUpdateRisk(index, 'coutMitigation', v as number)} unit="€" placeholder="0.00" />
                                     <RiskInput label="Probabilité après mitigation" type="number" value={risk.probabiliteApres} onChange={v => handleUpdateRisk(index, 'probabiliteApres', v as number)} unit="%" placeholder="0" />
                                </div>
                                <ResultCard label="Coût probable après mitigation" value={formatCurrency(risk.coutProbableApres)} variant="mitigated" />
                            </div>
                        </div>
                    </div>
                ))}

                {projectRisks.length === 0 && (
                     <div className="bg-white rounded-lg shadow-md text-center text-gray-500 py-16 px-6">
                        <h3 className="text-lg font-semibold">Le tableau de risques est vide</h3>
                        <p className="mt-1">Cliquez sur "+ Ajouter un risque" pour commencer.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity" aria-modal="true" role="dialog">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg transform transition-all">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-xl font-semibold text-primary">Suggestion de risques par IA</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div>
                            <label htmlFor="contract-type" className="block text-sm font-medium text-gray-700 mb-2">
                                Veuillez sélectionner un type de contrat :
                            </label>
                            <select
                                id="contract-type"
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value as 'EPC' | 'IPP Autoconsommation' | 'SEED EPC')}
                                className="w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:ring-1 focus:ring-secondary focus:border-secondary transition"
                            >
                                <option value="EPC">EPC</option>
                                <option value="IPP Autoconsommation">IPP Autoconsommation</option>
                                <option value="SEED EPC">SEED EPC</option>
                            </select>
                        </div>

                        {suggestionError && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700" role="alert">
                                {suggestionError}
                            </div>
                        )}

                        <div className="flex justify-end items-center mt-6 pt-4 border-t space-x-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                Annuler
                            </button>
                            <button 
                                onClick={handleGenerateSuggestions} 
                                disabled={isSuggesting}
                                className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-opacity-90 flex items-center justify-center min-w-[200px] disabled:bg-opacity-70 disabled:cursor-wait"
                            >
                                {isSuggesting ? (
                                    <>
                                        <SpinnerIcon />
                                        <span className="ml-2">Génération en cours...</span>
                                    </>
                                ) : (
                                    'Générer les suggestions'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskTable;