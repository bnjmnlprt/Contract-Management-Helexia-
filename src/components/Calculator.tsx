import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { CalculatorInputs, SavedProject, FullCalculationResults } from '../utils/types';
import { exportElementAsPdf, exportDataAsCsv } from '../utils/export';
import { generateContentStreamWithRetry } from '../utils/geminiApi';
import ExportDropdown from './ExportDropdown';

// --- Helper & Icon Components ---

const CopyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2V10a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const GeminiIcon: React.FC = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.06899 15.128C4.85499 14.168 4.00099 12.668 4.00099 11C4.00099 8.239 6.23999 6 9.00099 6C10.669 6 12.169 6.853 13.129 8.068C13.5623 8.62083 14.0435 9.12948 14.569 9.589C15.836 10.7046 16.8049 12.0468 17.394 13.535C17.4475 13.6789 17.498 13.8239 17.545 13.97C17.832 14.925 18 15.943 18 17C18 19.761 15.761 22 13 22C11.331 22 9.83199 21.147 8.87199 19.932C8.43868 19.3792 7.95753 18.8705 7.43199 18.411C6.16499 17.2954 5.1961 15.9532 4.60699 14.465C4.55353 14.3211 4.50302 14.1761 4.45499 14.03C4.16799 13.075 4.00099 12.057 4.00099 11" fill="url(#gemini_paint0_linear_10_10)"/>
      <path d="M9.00095 6C10.4655 6 11.8341 6.64333 12.822 7.632C13.8099 8.62067 14.4522 9.98927 14.4522 11.453C14.4522 12.9167 13.8099 14.2853 12.822 15.274C11.8341 16.2627 10.4655 16.906 9.00095 16.906C7.53641 16.906 6.16781 16.2627 5.17995 15.274C4.19209 14.2853 3.54972 12.9167 3.54972 11.453C3.54972 9.98927 4.19209 8.62067 5.17995 7.632C6.16781 6.64333 7.53641 6 9.00095 6Z" fill="#4285F4"/>
      <path d="M17.545 13.97C17.498 13.8239 17.4475 13.6789 17.394 13.535C18.261 12.181 18.75 10.638 18.75 9C18.75 5.269 15.731 2.25 12 2.25C10.362 2.25 8.819 2.739 7.465 3.606C7.32107 3.65947 7.17611 3.71598 7.03 3.77499C6.075 4.06199 5.057 4.229 4 4.229" fill="url(#gemini_paint1_linear_10_10)"/>
      <defs>
        <linearGradient id="gemini_paint0_linear_10_10" x1="11" y1="6" x2="11.5" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDB002"/>
          <stop offset="1" stopColor="#F6522E"/>
        </linearGradient>
        <linearGradient id="gemini_paint1_linear_10_10" x1="4" y1="9" x2="18.75" y2="8.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#12B5CB"/>
          <stop offset="1" stopColor="#0EA44B"/>
        </linearGradient>
      </defs>
    </svg>
);

const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


interface InputGroupProps {
  label: string;
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: keyof CalculatorInputs;
  type?: string;
  unit?: string;
  step?: string;
  placeholder?: string;
  tooltip?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, name, type = 'number', unit, step, placeholder, tooltip }) => (
  <div className="flex flex-col">
    <label htmlFor={name} className="mb-1.5 text-sm font-medium text-gray-600" title={tooltip}>{label}</label>
    <div className="relative">
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        step={step || "any"}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:ring-1 focus:ring-secondary focus:border-secondary transition"
        aria-label={label}
      />
      {unit && <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 text-sm">{unit}</span>}
    </div>
  </div>
);


interface StatCardProps {
  title: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
     <div className="text-center">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-primary mt-2">{value}</p>
     </div>
  </div>
);

const DetailRow: React.FC<{ label: string; value: string; isHeader?: boolean; isFooter?: boolean }> = ({ label, value, isHeader, isFooter }) => (
    <div className={`flex justify-between items-baseline ${isHeader ? 'text-xs text-gray-500 uppercase font-semibold' : 'py-2 border-b border-gray-100'} ${isFooter ? 'font-bold text-secondary !mt-4' : ''}`}>
        <span>{label}</span>
        <span className={isFooter ? 'text-lg' : 'text-primary'}>{value}</span>
    </div>
);

const BreakdownItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-lg font-bold text-primary">{value}</p>
    </div>
);

const BLANK_INPUTS: Omit<CalculatorInputs, 'projectName'> = {
  // PV
  centraleTotal: 0,
  oAndMAnnuel: 0,
  productionAnnuelMWh: 0,
  plantLifetimeYears: 30,
  selfConsumptionRate: 100,
  gridPriceMWh: 200,
  capPercentage: 5,
  administrativeFeesPercentage: 10,
  // SEED & Mode
  calculationMode: 'pv',
  montantMarche: 0,
  tauxPenaliteJournalier: 0.5,
  plafondPenalitesPourcentage: 10,
  nombreJoursRetard: 0,
};

const BLANK_RESULTS: FullCalculationResults = {
  // PV
  totalImpactJournalier: 0,
  plafondValeur: 0,
  plafondJours: 0,
  centraleAnnuel: 0,
  centraleJournalier: 0,
  oAndMAnnuel: 0,
  oAndMJournalier: 0,
  autoconsommationAnnuel: 0,
  autoconsommationJournalier: 0,
  tco: 0,
  coutSoutirageReseau: 0,
  coutSoutirageCentrale: 0,
  impactFinancierJournalier: 0,
  fraisAdministratifs: 0,
  // SEED
  penaliteJournaliereSeed: 0,
  plafondMontantSeed: 0,
  penaliteTotaleSeed: 0,
  penaliteFinaleSeed: 0,
};


// --- Main Component ---
interface CalculatorProps {
    onSave: (inputs: CalculatorInputs, results: FullCalculationResults) => void;
    initialData: SavedProject | null;
    onCancel: () => void;
    projectName: string;
}


const Calculator: React.FC<CalculatorProps> = ({ onSave, initialData, onCancel, projectName }) => {
  const [inputs, setInputs] = useState<CalculatorInputs>(BLANK_INPUTS);
  const [calculationMode, setCalculationMode] = useState<'pv' | 'seed'>('pv');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorText, setEditorText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    if(initialData?.inputs) {
        setInputs({ ...BLANK_INPUTS, ...initialData.inputs });
        setCalculationMode(initialData.inputs.calculationMode || 'pv');
    } else {
        setInputs(BLANK_INPUTS);
        setCalculationMode('pv');
    }
  }, [initialData]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  }, []);
  
  const handleModeChange = (mode: 'pv' | 'seed') => {
    setCalculationMode(mode);
    setInputs(prev => ({ ...prev, calculationMode: mode }));
  };

  const formatCurrency = useCallback((value: number, digits = 2) => {
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  }, []);

  const formatNumber = useCallback((value: number, digits = 2) => {
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  }, []);

  const calculations = useMemo((): FullCalculationResults => {
    const safeDiv = (num: number, den: number) => (den === 0 ? 0 : num / den);
    
    if (calculationMode === 'seed') {
        const { montantMarche = 0, tauxPenaliteJournalier = 0.5, plafondPenalitesPourcentage = 10, nombreJoursRetard = 0 } = inputs;
        const penaliteJournaliereSeed = (montantMarche * tauxPenaliteJournalier) / 100;
        const plafondMontantSeed = (montantMarche * plafondPenalitesPourcentage) / 100;
        const penaliteTotaleSeed = penaliteJournaliereSeed * nombreJoursRetard;
        const penaliteFinaleSeed = Math.min(penaliteTotaleSeed, plafondMontantSeed);
        
        return {
            ...BLANK_RESULTS,
            penaliteJournaliereSeed,
            plafondMontantSeed,
            penaliteTotaleSeed,
            penaliteFinaleSeed,
        };
    }
    
    // Mode PV
    const { plantLifetimeYears, centraleTotal, oAndMAnnuel, productionAnnuelMWh, selfConsumptionRate, gridPriceMWh, capPercentage, administrativeFeesPercentage } = inputs;

    const centraleAnnuel = safeDiv(centraleTotal, plantLifetimeYears);
    const centraleJournalier = safeDiv(centraleAnnuel, 365);
    const oAndMJournalier = safeDiv(oAndMAnnuel, 365);
    const autoconsommationAnnuel = productionAnnuelMWh * (selfConsumptionRate / 100);
    const autoconsommationJournalier = safeDiv(autoconsommationAnnuel, 365);
    const tco = safeDiv(centraleAnnuel + oAndMAnnuel, productionAnnuelMWh);
    const coutSoutirageReseau = autoconsommationJournalier * gridPriceMWh;
    const coutSoutirageCentrale = autoconsommationJournalier * tco;
    const impactFinancierJournalier = coutSoutirageReseau - coutSoutirageCentrale;
    const fraisAdministratifs = impactFinancierJournalier * (administrativeFeesPercentage / 100);
    const totalImpactJournalier = impactFinancierJournalier + fraisAdministratifs;
    const plafondValeur = centraleTotal * (capPercentage / 100);
    const plafondJours = safeDiv(plafondValeur, totalImpactJournalier);

    return { 
        ...BLANK_RESULTS,
        totalImpactJournalier, plafondValeur, plafondJours, centraleAnnuel, centraleJournalier, oAndMAnnuel: inputs.oAndMAnnuel,
        oAndMJournalier, autoconsommationAnnuel, autoconsommationJournalier, tco, coutSoutirageReseau,
        coutSoutirageCentrale, impactFinancierJournalier, fraisAdministratifs
    };
  }, [inputs, calculationMode]);
  
  const defaultEditorText = useMemo(() => {
    if (calculationMode === 'seed') {
        const { tauxPenaliteJournalier = 0.5, plafondPenalitesPourcentage = 10 } = inputs;
        const rateFormatted = `${formatNumber(tauxPenaliteJournalier, 2)} %`;
        const capFormatted = `${formatNumber(plafondPenalitesPourcentage, 0)} %`;
        
        return `En cas de retard dans l'exécution des prestations, une pénalité de ${rateFormatted} par jour de retard sera appliquée sur le montant total HT du marché.\n\nLe montant total de ces pénalités est plafonné à ${capFormatted} du montant total HT du marché.`;
    }

    // Mode PV
    const penaltyValueForA = Math.ceil(calculations.totalImpactJournalier);
    const penaltyFormattedForA = formatNumber(penaltyValueForA, 0);
    const capPercentageForB = inputs.capPercentage;
    const capFormattedForB = `${formatNumber(capPercentageForB, 0)} %`;

    return `En cas de non-respect de la Date de Remise des Travaux Garantie ou en cas de non-respect de la Date de Réception Garantie du fait d’un retard imputable à Helexia et sauf cas de prolongation légitime stipulés ci-dessus, une Pénalité de Retard de ${penaltyFormattedForA} euros HT Forfaitaire par jour de retard s’appliquera.\n\nLes Pénalités de Retard susvisées seront limitées à un montant égal à ${capFormattedForB} du Prix.`
  }, [calculationMode, inputs, calculations.totalImpactJournalier, formatNumber]);

  useEffect(() => {
    if (isEditorOpen) {
      setEditorText(defaultEditorText);
    }
  }, [isEditorOpen, defaultEditorText]);
  
  // FIX: Implement AI clause generation using the streaming Gemini API.
  const handleGenerateClause = useCallback(async () => {
        setIsGenerating(true);
        setGenerationError(null);
        setEditorText('');
        
        try {
            const prompt = `Rédige une clause de pénalité de retard pour un contrat. Voici les détails:\n${defaultEditorText}`;
            
            const stream = await generateContentStreamWithRetry({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            for await (const chunk of stream) {
                setEditorText(prev => prev + chunk.text);
            }

        } catch (error) {
            console.error("Erreur lors de la génération de la clause:", error);
            setGenerationError(error instanceof Error ? error.message : "Une erreur est survenue lors de la génération.");
            setEditorText(defaultEditorText); // Restore default text on error
        } finally {
            setIsGenerating(false);
        }
    }, [defaultEditorText]);

  const handleSaveClick = () => {
    const inputsToSave = { ...inputs, calculationMode };
    onSave(inputsToSave, calculations);
  }

  const handlePdfExport = () => {
    if (!projectName) {
        alert("Le nom du projet est manquant.");
        return;
    }
    exportElementAsPdf(
      'calculator-export-area', 
      `helexia_penalites_${projectName.replace(/\s+/g, '_')}.pdf`,
      '.export-actions, #editor-section'
    );
  };

  const handleExcelExport = () => {
    const fileName = `Export_Penalites_${projectName?.replace(/\s+/g, '_') || 'Nouveau_Calcul'}.csv`;
    let dataToExport: { Description: string, Valeur: string | number | undefined }[] = [];

    if (calculationMode === 'seed') {
        dataToExport = [
            { Description: 'Nom du Projet', Valeur: projectName || 'N/A' },
            { Description: 'Type de Calcul', Valeur: 'Pourcentage (SEED)' },
            // FIX: Satisfy the type for the empty row object
            { Description: '', Valeur: '' },
            { Description: 'Montant du marché (€)', Valeur: inputs.montantMarche?.toLocaleString('fr-FR') },
            { Description: 'Taux pénalité (%/jour)', Valeur: inputs.tauxPenaliteJournalier?.toLocaleString('fr-FR') },
            { Description: 'Plafond pénalités (%)', Valeur: inputs.plafondPenalitesPourcentage?.toLocaleString('fr-FR') },
            { Description: 'Nombre de jours de retard', Valeur: inputs.nombreJoursRetard?.toLocaleString('fr-FR') },
            // FIX: Satisfy the type for the empty row object
            { Description: '', Valeur: '' },
            { Description: 'Pénalité par jour (€)', Valeur: calculations.penaliteJournaliereSeed?.toLocaleString('fr-FR') },
            { Description: 'Montant du Plafond (€)', Valeur: calculations.plafondMontantSeed?.toLocaleString('fr-FR') },
            { Description: 'Pénalité Totale (avant plafond) (€)', Valeur: calculations.penaliteTotaleSeed?.toLocaleString('fr-FR') },
            { Description: 'Pénalité Finale (après plafond) (€)', Valeur: calculations.penaliteFinaleSeed?.toLocaleString('fr-FR') },
        ];
    } else {
        const options2Decimales = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
        dataToExport = [
            { Description: 'Nom du Projet', Valeur: projectName || 'N/A' },
            { Description: 'Type de Calcul', Valeur: 'Forfaitaire (PV)' },
            // FIX: Satisfy the type for the empty row object
            { Description: '', Valeur: '' },
            { Description: 'Pénalité (€/jour)', Valeur: calculations.totalImpactJournalier.toLocaleString('fr-FR') },
            { Description: 'Valeur du Plafond (€)', Valeur: calculations.plafondValeur.toLocaleString('fr-FR') },
            { Description: 'Jours Avant Plafond', Valeur: calculations.plafondJours.toLocaleString('fr-FR') },
            // FIX: Satisfy the type for the empty row object
            { Description: '', Valeur: '' },
            { Description: 'Coût total Centrale (€)', Valeur: inputs.centraleTotal.toLocaleString('fr-FR') },
            { Description: 'O&M Annuel (€)', Valeur: inputs.oAndMAnnuel.toLocaleString('fr-FR') },
            { Description: 'Production Annuelle (MWh/an)', Valeur: inputs.productionAnnuelMWh.toLocaleString('fr-FR') },
            // FIX: Satisfy the type for the empty row object
            { Description: '', Valeur: '' },
            { Description: 'TCO (€/MWh)', Valeur: calculations.tco.toLocaleString('fr-FR', options2Decimales) },
        ];
    }
    exportDataAsCsv(dataToExport, fileName);
  };

  const handleCopyClick = useCallback(() => {
    if (copied) return;
    navigator.clipboard.writeText(editorText).then(() => {
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Erreur lors de la copie du texte.');
    });
  }, [editorText, copied]);

  return (
    <div id="calculator-export-area">
      <div className="space-y-8">
        <div className="flex justify-between items-center gap-8">
            <h1 className="text-3xl font-bold text-primary flex-shrink-0">Calcul de pénalité de retard</h1>
        </div>
        
        <div className="flex justify-center mb-6">
            <div className="bg-gray-200 rounded-lg p-1 flex space-x-1">
                <button onClick={() => handleModeChange('pv')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${calculationMode === 'pv' ? 'bg-white text-primary shadow' : 'bg-transparent text-gray-600'}`}>
                Forfaitaire (PV)
                </button>
                <button onClick={() => handleModeChange('seed')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${calculationMode === 'seed' ? 'bg-white text-primary shadow' : 'bg-transparent text-gray-600'}`}>
                Pourcentage (SEED)
                </button>
            </div>
        </div>

        {calculationMode === 'pv' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Pénalité" value={formatCurrency(Math.ceil(calculations.totalImpactJournalier), 0)} />
                <StatCard title="Valeur du Plafond" value={formatCurrency(calculations.plafondValeur, 0)} />
                <StatCard title="Jours avant Plafond" value={formatNumber(Math.ceil(calculations.plafondJours), 0)} />
            </div>
        ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Pénalité / Jour" value={formatCurrency(calculations.penaliteJournaliereSeed || 0)} />
                <StatCard title="Plafond" value={formatCurrency(calculations.plafondMontantSeed || 0, 0)} />
                <StatCard title="Pénalité Totale" value={formatCurrency(calculations.penaliteTotaleSeed || 0, 0)} />
                <StatCard title="Pénalité Finale" value={formatCurrency(calculations.penaliteFinaleSeed || 0, 0)} />
            </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 lg:p-8">
            {calculationMode === 'pv' ? (
                // FORMULAIRE PV
                <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-16">
                    <div className="space-y-10">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Paramètres du Projet (PV)</h3>
                            <div className="space-y-4">
                                <InputGroup label="Coût Total Centrale (€)" name="centraleTotal" value={inputs.centraleTotal} onChange={handleInputChange} />
                                <InputGroup label="O&M Annuel (€)" name="oAndMAnnuel" value={inputs.oAndMAnnuel} onChange={handleInputChange} />
                                <InputGroup label="Production (MWh/an)" name="productionAnnuelMWh" value={inputs.productionAnnuelMWh} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Infos supplémentaires</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <InputGroup label="Durée de vie (années)" name="plantLifetimeYears" value={inputs.plantLifetimeYears} onChange={handleInputChange} />
                                <InputGroup label="Taux d'autoconso (%)" name="selfConsumptionRate" value={inputs.selfConsumptionRate} onChange={handleInputChange} />
                                <InputGroup label="Prix Soutirage (€/MWh)" name="gridPriceMWh" value={inputs.gridPriceMWh} onChange={handleInputChange} />
                                <InputGroup label="Frais admin. (%)" name="administrativeFeesPercentage" value={inputs.administrativeFeesPercentage} onChange={handleInputChange} />
                                <InputGroup label="Plafond (%)" name="capPercentage" value={inputs.capPercentage} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-8 mt-10 lg:mt-0 lg:border-l lg:pl-12 border-gray-200">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Détail du calcul par jour de retard</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between items-baseline text-xs text-gray-500 uppercase font-semibold pb-2"><span>Poste</span><div className="flex space-x-8"><span>Annuel</span><span>Journalier</span></div></div>
                                <div className="bg-gray-50 p-3 rounded-md space-y-2">
                                    <div className="flex justify-between items-baseline py-1 border-b border-gray-200"><span>Centrale</span> <div className="flex space-x-8 text-right"><span>{formatCurrency(calculations.centraleAnnuel)}</span> <span>{formatCurrency(calculations.centraleJournalier)}</span></div></div>
                                    <div className="flex justify-between items-baseline py-1 border-b border-gray-200"><span>O&M</span> <div className="flex space-x-8 text-right"><span>{formatCurrency(calculations.oAndMAnnuel)}</span> <span>{formatCurrency(calculations.oAndMJournalier)}</span></div></div>
                                    <div className="flex justify-between items-baseline py-1"><span>Autoconsommation (MWh)</span> <div className="flex space-x-8 text-right"><span>{formatNumber(calculations.autoconsommationAnnuel)}</span> <span>{formatNumber(calculations.autoconsommationJournalier, 2)}</span></div></div>
                                </div>
                                <div className="flex justify-between items-baseline font-bold text-secondary pt-3 text-base"><span>TCO (€/MWh)</span><span>{formatCurrency(calculations.tco)}</span></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 pt-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Coûts Journaliers</h3>
                                <div className="space-y-3"><BreakdownItem label="Soutirage Réseau (EDF)" value={formatCurrency(calculations.coutSoutirageReseau)} /><BreakdownItem label="Soutirage Centrale" value={formatCurrency(calculations.coutSoutirageCentrale)} /></div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Pénalité</h3>
                                <div className="space-y-3">
                                    <BreakdownItem label="Impact financier (€/jour)" value={formatCurrency(calculations.impactFinancierJournalier)} /><BreakdownItem label="Frais administratifs" value={formatCurrency(calculations.fraisAdministratifs)} />
                                    <div className="pt-3 border-t border-gray-200"><p className="text-sm text-gray-600">Impact financier total (€/jour)</p><p className="text-lg font-bold text-secondary">{formatCurrency(calculations.totalImpactJournalier)}</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // FORMULAIRE SEED
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Paramètres du Projet (SEED)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <InputGroup label="Montant du marché (€)" name="montantMarche" value={inputs.montantMarche || ''} onChange={handleInputChange} tooltip="Montant total hors taxes du marché ou du contrat." />
                        <InputGroup label="Taux de pénalité (% par jour)" name="tauxPenaliteJournalier" value={inputs.tauxPenaliteJournalier || ''} onChange={handleInputChange} step="0.01" tooltip="Pourcentage du montant du marché appliqué par jour de retard." />
                        <InputGroup label="Plafond des pénalités (%)" name="plafondPenalitesPourcentage" value={inputs.plafondPenalitesPourcentage || ''} onChange={handleInputChange} tooltip="Pourcentage maximum du montant du marché que les pénalités totales ne peuvent dépasser."/>
                        <InputGroup label="Nombre de jours de retard" name="nombreJoursRetard" value={inputs.nombreJoursRetard || ''} onChange={handleInputChange} tooltip="Le nombre de jours de retard à simuler pour calculer la pénalité totale."/>
                    </div>
                </div>
            )}
            
            {isEditorOpen && (
                <div id="editor-section" className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">Rédacteur de clause</h3>
                        <button type="button" onClick={handleGenerateClause} disabled={isGenerating} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:cursor-wait" title="Générer une proposition avec l'IA">
                            {isGenerating ? <SpinnerIcon /> : <GeminiIcon />}
                            <span>{isGenerating ? 'Génération...' : "Rédiger avec l'IA"}</span>
                        </button>
                    </div>
                    {generationError && <p className="text-sm text-red-600 mb-2">{generationError}</p>}
                    <p className="text-sm text-gray-500 mb-4">Le texte ci-dessous est pré-rempli avec les valeurs calculées. Vous pouvez le modifier ou utiliser l'IA pour générer une nouvelle proposition.</p>
                    <div className="relative">
                        <textarea value={editorText} onChange={(e) => setEditorText(e.target.value)} rows={10} className="w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm p-3 pr-14 text-gray-800 focus:ring-1 focus:ring-secondary focus:border-secondary transition" aria-label="Rédacteur de clause" />
                        <button type="button" onClick={handleCopyClick} className="absolute top-3 right-3 p-1.5 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-secondary transition-colors" aria-label="Copier le texte" title="Copier le texte">
                            {copied ? <CheckIcon /> : <CopyIcon />}
                        </button>
                    </div>
                </div>
            )}
            
            <div className="pt-6 mt-8 border-t border-gray-200 flex justify-end items-center space-x-3 export-actions">
              <button type="button" onClick={() => setIsEditorOpen(prev => !prev)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" aria-expanded={isEditorOpen} aria-controls="editor-section">
                {isEditorOpen ? 'Fermer Rédacteur' : 'Rédacteur'}
              </button>
              <div className="flex-grow"></div>
              {initialData && (<button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">Annuler</button>)}
              <ExportDropdown onPdfExport={handlePdfExport} onExcelExport={handleExcelExport} disabled={!projectName} />
              <button type="button" onClick={handleSaveClick} className="px-4 py-2 text-sm font-medium text-white bg-secondary border border-transparent rounded-md shadow-sm hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">
                  Mettre à jour le Projet
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
