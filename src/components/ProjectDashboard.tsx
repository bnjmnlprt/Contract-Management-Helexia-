import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { SavedProject, RiskItem, CalculatorInputs, FullCalculationResults, ContractDeadline, ChangeRequest, Amendment, ProjectStatus } from '../utils/types';
import Calculator from './Calculator';
import RiskTable from './RiskTable';
import { generateContentWithRetry } from '../utils/geminiApi';
import PartenaireEntrainementChat from './PartenaireEntrainementChat';
import ExportDropdown from './ExportDropdown';
import { exportElementAsPdf, exportDataAsCsv, exportChangeRequestAsPdf } from '../utils/export';
import mammoth from 'mammoth';
import { formatDate } from '../utils/formatters';
import GovernanceMatrix from './GovernanceMatrix';

// Because we're using a CDN script for pdf.js, we need to declare the global for TypeScript
declare const pdfjsLib: any;

// --- Helper & Icon Components ---
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

const KpiCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-primary mt-1">{value}</p>
    </div>
);


// --- Edit Deadline Modal Component ---
interface EditDeadlineModalProps {
    isOpen: boolean;
    onClose: () => void;
    deadline: ContractDeadline;
    onSave: (updatedDeadline: ContractDeadline) => void;
}

const EditDeadlineModal: React.FC<EditDeadlineModalProps> = ({ isOpen, onClose, deadline, onSave }) => {
    const [description, setDescription] = useState(deadline.description);
    const [date, setDate] = useState(deadline.date);
    const [noticePeriodInMonths, setNoticePeriodInMonths] = useState(deadline.noticePeriodInMonths);
    const [type, setType] = useState(deadline.type || 'Échéance');
    const [amount, setAmount] = useState(deadline.amount);

    useEffect(() => {
        if (deadline) {
            setDescription(deadline.description);
            setDate(deadline.date);
            setNoticePeriodInMonths(deadline.noticePeriodInMonths);
            setType(deadline.type || 'Échéance');
            setAmount(deadline.amount);
        }
    }, [deadline]);

    const handleSubmit = () => {
        if (description.trim()) {
            onSave({
                ...deadline,
                description,
                date,
                noticePeriodInMonths,
                type,
                amount: type === 'Jalon de Paiement' ? amount : null,
            });
        } else {
            alert("Veuillez donner une description à l'échéance.");
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg transform transition-all">
                <h3 className="text-xl font-semibold text-primary mb-4">Modifier l'échéance / Jalon</h3>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="edit-deadline-type" className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            id="edit-deadline-type"
                            value={type}
                            onChange={(e) => setType(e.target.value as 'Échéance' | 'Jalon de Paiement')}
                            className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white"
                        >
                            <option value="Échéance">Échéance</option>
                            <option value="Jalon de Paiement">Jalon de Paiement</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="edit-deadline-desc" className="block text-sm font-medium text-gray-700">Description</label>
                        <input
                            id="edit-deadline-desc"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white"
                        />
                    </div>
                    {type === 'Jalon de Paiement' && (
                         <div>
                            <label htmlFor="edit-deadline-amount" className="block text-sm font-medium text-gray-700">Montant (€)</label>
                            <input
                                id="edit-deadline-amount"
                                type="number"
                                value={amount === null ? '' : amount}
                                onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : null)}
                                className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white"
                                placeholder="0.00"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="edit-deadline-date" className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            id="edit-deadline-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-deadline-notice" className="block text-sm font-medium text-gray-700">Préavis (mois)</label>
                        <input
                            id="edit-deadline-notice"
                            type="number"
                            value={noticePeriodInMonths}
                            onChange={(e) => setNoticePeriodInMonths(parseInt(e.target.value, 10))}
                            className="w-24 p-2 border border-gray-300 rounded-md mt-1 bg-white"
                        />
                    </div>
                </div>
                <div className="flex justify-end items-center mt-6 pt-4 border-t space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Annuler</button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md shadow-sm hover:bg-opacity-90">Enregistrer</button>
                </div>
            </div>
        </div>
    );
};

// --- Change Request Modal Component (Copied from ChangeManagementModule for reusability) ---
const getStatusClasses = (status: ChangeRequest['status']) => {
    switch (status) {
        case 'Approuvé': return 'bg-green-100 text-green-800';
        case 'Rejeté': return 'bg-red-100 text-red-800';
        case 'En Analyse': return 'bg-yellow-100 text-yellow-800';
        case 'Implémenté': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const getPriorityClasses = (priority: ChangeRequest['priority']) => {
    switch (priority) {
        case 'Élevée': return 'bg-red-100 text-red-800';
        case 'Moyenne': return 'bg-orange-100 text-orange-800';
        default: return 'bg-blue-100 text-blue-800';
    }
};

// Interface pour les risques structurés retournés par l'analyse de l'IA
interface StructuredAnalysisItem {
    theme: string;
    positionNotreContrat: string;
    positionB: string;
    analyse: string;
    niveauRisque: string;
    negociation: string;
    chatHistory?: Array<{ role: 'user' | 'model'; parts: string }>;
}

interface ProjectDashboardProps {
    project: SavedProject;
    changeRequests: ChangeRequest[];
    onSaveChanges: (inputs: CalculatorInputs, results: FullCalculationResults) => void;
    onUpdateRisks: (risks: RiskItem[]) => void;
    onUpdateDeadlines: (deadlines: ContractDeadline[]) => void;
    onSuggestRisks: (contractType: string) => Promise<boolean>;
    isSuggesting: boolean;
    onBackToList: () => void;
    onNewRequest: () => void;
    onEditChangeRequest: (req: ChangeRequest) => void;
    onUpdateProject: (projectId: string, updatedData: Partial<SavedProject>) => void;
}

const EditableInfoCard = ({ label, value, onSave }: { label: string, value: string | undefined, onSave: (newValue: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || '');
  useEffect(() => {
    setCurrentValue(value || '');
  }, [value]);
  const handleSave = () => {
    onSave(currentValue);
    setIsEditing(false);
  };
  return (
    <div className="bg-gray-50 p-4 rounded-lg border h-full">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {isEditing ? (
        <div className="flex items-center mt-1 space-x-2">
          <input
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            // Style important : fond blanc comme demandé
            className="w-full p-1 border border-gray-300 rounded-md bg-white text-lg font-semibold text-primary"
            autoFocus
          />
          <button onClick={handleSave} className="px-3 py-1 text-sm bg-secondary text-white rounded">OK</button>
        </div>
      ) : (
        <div onClick={() => setIsEditing(true)} className="mt-1 text-lg font-semibold text-primary cursor-pointer truncate">
          {value ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="hover:underline">{value}</a>
          ) : (
            <span className="text-gray-400 italic">Ajouter un lien...</span>
          )}
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-gray-50 p-4 rounded-lg border">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-primary break-words">{value || '-'}</p>
    </div>
);

const RiskDetail = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="mt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-700 mt-1">{value}</p>
    </div>
);

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ 
    project, 
    changeRequests,
    onSaveChanges, 
    onUpdateRisks, 
    onUpdateDeadlines,
    onSuggestRisks, 
    isSuggesting,
    onBackToList,
    onNewRequest,
    onEditChangeRequest,
    onUpdateProject
}) => {
    const [activeTab, setActiveTab] = useState<'sommaire' | 'calculator' | 'risks' | 'analysis' | 'changements' | 'gouvernance'>('sommaire');

    const [newDeadlineDesc, setNewDeadlineDesc] = useState('');
    const [newDeadlineDate, setNewDeadlineDate] = useState('');
    const [newDeadlineNotice, setNewDeadlineNotice] = useState(3);
    const [newDeadlineType, setNewDeadlineType] = useState<'Échéance' | 'Jalon de Paiement'>('Échéance');
    const [newDeadlineAmount, setNewDeadlineAmount] = useState<number | null>(null);
    const [editingDeadline, setEditingDeadline] = useState<ContractDeadline | null>(null);

    // State for Analysis Tab
    const [analysisResult, setAnalysisResult] = useState('');
    const [structuredAnalysis, setStructuredAnalysis] = useState<StructuredAnalysisItem[]>([]);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [uploadedContractText, setUploadedContractText] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [isChattingAnalysis, setIsChattingAnalysis] = useState<number | null>(null);

    const projectChangeRequests = useMemo(() => 
        changeRequests.filter(cr => cr.projectId === project.id),
        [changeRequests, project.id]
    );

    const formatCurrency = useCallback((value: number, digits = 0) => {
        if (isNaN(value) || !isFinite(value)) return 'N/A';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
    }, []);

    const projectKpis = useMemo(() => {
        const risks = project.risks || [];
    
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
    
        const ongoingChanges = projectChangeRequests.filter(cr => cr.status === 'Demandé' || cr.status === 'En Analyse').length;
    
        const totalCostImpact = projectChangeRequests.reduce((acc, cr) => {
            if (cr.status === 'Approuvé' || cr.status === 'Implémenté') {
                return acc + (cr.estimatedCost || 0);
            }
            return acc;
        }, 0);
        
        return {
            exposureBefore,
            exposureAfter,
            ongoingChanges,
            totalCostImpact,
        };
    }, [project, projectChangeRequests]);


    useEffect(() => {
        if (project.projectType === 'IPP Autoconsommation' || project.projectType === 'PV Injection') {
          setNewDeadlineType('Échéance');
        }
    }, [project.projectType]);
    
    useEffect(() => {
        if (typeof (window as any).pdfjsLib !== 'undefined') {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        }
    }, []);

    const handleAddDeadline = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeadlineDesc || !newDeadlineDate) {
            alert("Veuillez remplir la description et la date.");
            return;
        }
        const newDeadline: ContractDeadline = {
            id: `deadline-${Date.now()}`,
            description: newDeadlineDesc,
            date: newDeadlineDate,
            noticePeriodInMonths: newDeadlineNotice,
            type: newDeadlineType,
            amount: newDeadlineType === 'Jalon de Paiement' ? newDeadlineAmount : null,
        };
        onUpdateDeadlines([...project.deadlines, newDeadline]);
        setNewDeadlineDesc('');
        setNewDeadlineDate('');
        setNewDeadlineNotice(3);
        setNewDeadlineType('Échéance');
        setNewDeadlineAmount(null);
    };
    
    const handleDeleteDeadline = (id: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette échéance ?")) {
            onUpdateDeadlines(project.deadlines.filter(d => d.id !== id));
        }
    };

    const handleSaveDeadline = (updatedDeadline: ContractDeadline) => {
        onUpdateDeadlines(project.deadlines.map(d => d.id === updatedDeadline.id ? updatedDeadline : d));
        setEditingDeadline(null);
    };

    const handleUpdateProjectInfo = (field: keyof SavedProject, value: string) => {
        onUpdateProject(project.id, { [field]: value });
    };

    const handleFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setUploadedFileName('');
        setUploadedContractText('');
        setAnalysisResult('');
        setStructuredAnalysis([]);
        setAnalysisError(null);

        const file = event.dataTransfer.files[0];
        if (!file) return;
        setUploadedFileName(file.name);
        const reader = new FileReader();

        if (file.name.endsWith('.pdf')) {
          reader.onload = async (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            try {
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              let fullText = '';
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map((item: any) => item.str).join(' ');
              }
              setUploadedContractText(fullText);
            } catch (error) {
              console.error("Erreur lors de la lecture du .pdf :", error);
              alert("Impossible de lire le contenu de ce fichier .pdf.");
            }
          };
          reader.readAsArrayBuffer(file);
        }
        else if (file.name.endsWith('.docx')) {
          reader.onload = async (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            try {
              const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
              setUploadedContractText(result.value);
            } catch (error) {
              console.error("Erreur lors de la lecture du .docx :", error);
              alert("Impossible de lire le contenu de ce fichier .docx.");
            }
          };
          reader.readAsArrayBuffer(file);
        }
        else if (file.name.endsWith('.txt')) {
          reader.onload = (e) => {
            setUploadedContractText(e.target?.result as string);
          };
          reader.readAsText(file);
        }
        else {
          setUploadedFileName('');
          alert("Erreur : Format non supporté. Veuillez déposer un fichier .txt, .docx ou .pdf.");
        }
    };

    const handleAnalysis = async () => {
        if (!uploadedContractText || !project.baseTermsheet) {
            alert("Veuillez déposer un contrat à analyser et vous assurer que le projet a un contrat de référence.");
            return;
        }
        setIsLoadingAnalysis(true);
        setAnalysisResult('');
        setStructuredAnalysis([]);
        setAnalysisError(null);

        try {
            const prompt = `Tu es un expert en droit des affaires et contract management pour la société Helexia, spécialisée en projets énergétiques. Tu analyses les clauses d'un contrat client (Document B) par rapport au contrat type de Helexia (Document A).
    
    DOCUMENT A (Notre contrat type - HELEXIA - ${project.baseTermsheetName}) :
    ---
    ${project.baseTermsheet}
    ---
    
    DOCUMENT B (Contrat client/fournisseur - ${uploadedFileName}) :
    ---
    ${uploadedContractText}
    ---
    
    MISSION :
    1.  **Synthèse Globale** : Rédige une synthèse concise (3-4 phrases) évaluant le niveau de risque global (Faible, Moyen, Élevé) en comparant le document B au document A. Pointe les 2-3 points de friction les plus importants (ex: responsabilité, paiement, propriété intellectuelle, garanties).
    
    2.  **Tableau des Écarts** : Identifie les écarts les plus critiques entre les deux documents. Pour chaque écart, structure ta réponse au format JSON STRICT suivant, sans aucun texte avant ou après le tableau JSON :
    
    [
      {
        "theme": "Titre du point de friction (ex: Plafond de responsabilité)",
        "positionNotreContrat": "Citation exacte ou résumé très court de notre clause dans le document A.",
        "positionB": "Citation exacte ou résumé très court de la clause correspondante dans le document B.",
        "analyse": "Analyse concise de l'écart et de ses implications pour Helexia (2-3 phrases max).",
        "niveauRisque": "Élevé / Moyen / Faible",
        "negociation": "Piste de négociation ou de compromis suggérée (1-2 phrases max)."
      }
    ]
    
    IMPORTANT : Sépare la synthèse globale et le tableau JSON par "---JSON---". Ne mets rien avant la synthèse ni après le JSON.`;
    
            const response = await generateContentWithRetry({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
    
            const responseText = response.text;
            const parts = responseText.split('---JSON---');
            if (parts.length < 2) {
                throw new Error("La réponse de l'IA n'est pas dans le format attendu (Synthèse---JSON---Tableau).");
            }
    
            const summary = parts[0].trim();
            const jsonString = parts[1].trim();
            
            const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```|(\[[\s\S]*\])/s);
            if (!jsonMatch) {
                console.error("Raw IA response (JSON part):", jsonString);
                throw new Error("La réponse de l'IA ne contient pas de tableau JSON valide.");
            }
            const cleanJsonString = jsonMatch[1] || jsonMatch[2];
    
            const structuredData = JSON.parse(cleanJsonString);
    
            setAnalysisResult(summary);
            setStructuredAnalysis(structuredData);
            setAnalysisError(null);
        } catch (error) {
            console.error("Erreur lors de l'analyse:", error);
            setAnalysisError(error instanceof Error ? error.message : "Une erreur inconnue est survenue");
            setAnalysisResult('');
            setStructuredAnalysis([]);
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    const handleAddRiskFromAnalysis = (analysisItem: StructuredAnalysisItem) => {
        if (!project) return;

        if (project.risks.some(r => r.risque === analysisItem.theme)) {
            alert(`Le risque "${analysisItem.theme}" existe déjà pour ce projet.`);
            return;
        }

        const newRisk: RiskItem = {
            uid: `risk-analysis-${Date.now()}`,
            id: `R-ANA-${(project.risks.length + 1).toString().padStart(3, '0')}`,
            projet: project.projectName,
            risque: analysisItem.theme,
            typeRisque: 'Contractuel / Analyse IA',
            description: `Écart identifié via l'analyse de contrat : ${analysisItem.analyse}`,
            coutProbableMaximal: null,
            probabiliteAvant: 75,
            explicationCalcul: `Risque basé sur la position du contrat adverse : "${analysisItem.positionB}"`,
            mitigationActions: analysisItem.negociation ? [{ id: `action-${Date.now()}`, description: analysisItem.negociation, dueDate: null, status: 'À Faire' }] : [],
            coutMitigation: null,
            probabiliteApres: null,
        };

        onUpdateRisks([...project.risks, newRisk]);
        alert(`Le risque "${analysisItem.theme}" a été ajouté au tableau des risques.`);
    };

    const handleSingleAnalysisItemExport = (item: StructuredAnalysisItem, index: number, format: 'pdf' | 'csv') => {
        const safeTheme = item.theme.substring(0, 20).replace(/\s+/g, '_');
        const fileName = `helexia_analyse_contrat_${safeTheme}`;

        if (format === 'csv') {
            const itemData = {
                'ID': index + 1,
                'Thème': item.theme,
                'Position Contrat Helexia': item.positionNotreContrat,
                'Position Contrat Externe': item.positionB,
                'Analyse': item.analyse,
                'Niveau de Risque': item.niveauRisque,
                'Pistes de Négociation': item.negociation,
            };
            exportDataAsCsv([itemData], `${fileName}.csv`);
        } else {
            exportElementAsPdf(`analysis-item-${index}`, `${fileName}.pdf`, '.export-actions');
        }
    };
    
    const handleSendMessage = async (itemIndex: number, question: string) => {
        const currentItem = structuredAnalysis[itemIndex];
        if (!currentItem) return;
    
        const updatedChatHistory = [...(currentItem.chatHistory || []), { role: 'user' as const, parts: question }];
        const updatedAnalysis = structuredAnalysis.map((item, index) =>
            index === itemIndex ? { ...item, chatHistory: updatedChatHistory } : item
        );
        setStructuredAnalysis(updatedAnalysis);
        setIsChattingAnalysis(itemIndex);
    
        const contextualPrompt = `
        Tu agis comme un partenaire d'entraînement nommé "WWCD (What Would Christophe Do?)". Ta mission est d'aider un expert en contract management à affiner sa stratégie de négociation concernant un point de friction entre son contrat type et celui d'un client/fournisseur.
        **CONTEXTE INITIAL DE L'ÉCART :**
        - Thème : ${currentItem.theme}
        - Analyse du Risque : ${currentItem.analyse}
        - Pistes de négociation initiales : ${currentItem.negociation}
    
        **HISTORIQUE DE VOTRE CONVERSATION :**
        ${updatedChatHistory.map(msg => `${msg.role === 'user' ? 'Contract Manager' : 'WWCD'}: ${msg.parts}`).join('\n')}
    
        **MISSION :**
        En te basant sur le contexte et l'historique, réponds de manière concise et pertinente à la dernière question du contract manager pour l'aider dans sa négociation. Sois direct et propose des solutions concrètes.
        `;
    
        try {
            const response = await generateContentWithRetry({
                model: 'gemini-2.5-flash',
                contents: contextualPrompt
            });
            const responseText = response.text;
    
            const finalChatHistory = [...updatedChatHistory, { role: 'model' as const, parts: responseText }];
            setStructuredAnalysis(currentAnalysis => currentAnalysis.map((item, index) =>
                index === itemIndex ? { ...item, chatHistory: finalChatHistory } : item
            ));
    
        } catch (error) {
            console.error("Erreur lors de l'appel à WWCD :", error);
            const errorMessage = error instanceof Error ? error.message : "Désolé, une erreur de communication est survenue.";
            const errorChatHistory = [...updatedChatHistory, { role: 'model' as const, parts: errorMessage }];
            setStructuredAnalysis(currentAnalysis => currentAnalysis.map((item, index) =>
                index === itemIndex ? { ...item, chatHistory: errorChatHistory } : item
            ));
        } finally {
            setIsChattingAnalysis(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <button onClick={onBackToList} className="text-sm font-medium text-secondary hover:underline mb-2">
                        &larr; Retour à la liste des projets
                    </button>
                    <h2 className="text-3xl font-bold text-primary">{project.projectName}</h2>
                    <p className="text-gray-500 mt-1">{project.projectCode} &bull; {project.projectAddress}</p>
                </div>
                <div className="flex items-center space-x-3 mt-2">
                    <button onClick={onNewRequest} className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-opacity-90 transition-colors">
                        + Demande de changement
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button onClick={() => setActiveTab('sommaire')} className={`px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'sommaire' ? 'border-b-2 border-secondary text-primary' : 'text-gray-500 hover:text-primary'}`}>Sommaire</button>
                    <button onClick={() => setActiveTab('calculator')} className={`px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'calculator' ? 'border-b-2 border-secondary text-primary' : 'text-gray-500 hover:text-primary'}`}>Calculateur</button>
                    <button onClick={() => setActiveTab('risks')} className={`px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'risks' ? 'border-b-2 border-secondary text-primary' : 'text-gray-500 hover:text-primary'}`}>Risques</button>
                    <button onClick={() => setActiveTab('analysis')} className={`px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'analysis' ? 'border-b-2 border-secondary text-primary' : 'text-gray-500 hover:text-primary'}`}>Analyse de Contrat</button>
                    <button onClick={() => setActiveTab('changements')} className={`px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'changements' ? 'border-b-2 border-secondary text-primary' : 'text-gray-500 hover:text-primary'}`}>Changements</button>
                    <button onClick={() => setActiveTab('gouvernance')} className={`px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'gouvernance' ? 'border-b-2 border-secondary text-primary' : 'text-gray-500 hover:text-primary'}`}>Gouvernance</button>
                </div>

                {/* Tab Content */}
                <div className="p-6 lg:p-8">
                    {activeTab === 'sommaire' && (
                        <div className="space-y-8">
                            {/* Project Info Section */}
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Informations Projet</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <InfoCard label="Type de projet" value={project.projectType} />
                                    <InfoCard label="Statut" value={project.status} />
                                    <EditableInfoCard label="URL du projet" value={project.projectUrl} onSave={(val) => handleUpdateProjectInfo('projectUrl', val)} />
                                </div>
                            </div>
                            
                             {/* Project KPI Section */}
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Indicateurs Clés de Performance</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <KpiCard title="Exposition Brute" value={formatCurrency(projectKpis.exposureBefore)} />
                                    <KpiCard title="Exposition Résiduelle" value={formatCurrency(projectKpis.exposureAfter)} />
                                    <KpiCard title="Changements en Cours" value={projectKpis.ongoingChanges.toString()} />
                                    <KpiCard title="Impact Financier Changements" value={formatCurrency(projectKpis.totalCostImpact)} />
                                </div>
                            </div>

                            {/* Deadlines Section */}
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Échéances et Jalons</h3>
                                <div className="space-y-3 mb-6">
                                    {(project.deadlines || []).length > 0 ? (
                                        (project.deadlines || []).map(d => (
                                            <div key={d.id} className="p-3 bg-gray-50 rounded-md border flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{d.description} {d.type === 'Jalon de Paiement' && d.amount ? `(${d.amount}€)` : ''}</p>
                                                    <p className="text-xs text-gray-500">Date: {formatDate(d.date)} | Type: {d.type}</p>
                                                </div>
                                                <div className="space-x-2">
                                                    <button onClick={() => setEditingDeadline(d)} className="text-xs font-semibold text-secondary hover:underline">Modifier</button>
                                                    <button onClick={() => handleDeleteDeadline(d.id)} className="text-xs font-semibold text-red-600 hover:underline">Supprimer</button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">Aucune échéance enregistrée.</p>
                                    )}
                                </div>

                                <form onSubmit={handleAddDeadline} className="p-4 border-t border-dashed">
                                    <h4 className="font-semibold text-gray-700 mb-3">Ajouter une échéance / jalon</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                        <div className="md:col-span-2">
                                            <label className="text-sm font-medium text-gray-600">Description</label>
                                            <input type="text" value={newDeadlineDesc} onChange={e => setNewDeadlineDesc(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" required/>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Date</label>
                                            <input type="date" value={newDeadlineDate} onChange={e => setNewDeadlineDate(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" required/>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Type</label>
                                             <select value={newDeadlineType} onChange={e => setNewDeadlineType(e.target.value as any)} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white">
                                                <option value="Échéance">Échéance</option>
                                                {(project.projectType !== 'IPP Autoconsommation' && project.projectType !== 'PV Injection') && <option value="Jalon de Paiement">Jalon de Paiement</option>}
                                            </select>
                                        </div>
                                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-opacity-90">Ajouter</button>
                                    </div>
                                    {newDeadlineType === 'Jalon de Paiement' && (
                                        <div className="mt-4">
                                            <label className="text-sm font-medium text-gray-600">Montant (€)</label>
                                            <input type="number" value={newDeadlineAmount || ''} onChange={e => setNewDeadlineAmount(e.target.value ? parseFloat(e.target.value) : null)} className="w-full max-w-xs mt-1 p-2 border border-gray-300 rounded-md bg-white" placeholder="0.00" />
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    )}
                    {activeTab === 'calculator' && (
                        <Calculator
                            onSave={onSaveChanges}
                            initialData={project}
                            onCancel={() => setActiveTab('sommaire')}
                            projectName={project.projectName}
                        />
                    )}
                    {activeTab === 'risks' && (
                         <RiskTable
                            projectRisks={project.risks}
                            onRisksChange={onUpdateRisks}
                            activeProjectName={project.projectName}
                            onSuggestRisks={onSuggestRisks}
                            isSuggesting={isSuggesting}
                        />
                    )}
                    {activeTab === 'analysis' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-gray-800">Analyse de Contrat</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contrat de Référence (Helexia)</label>
                                    <div className="p-4 bg-gray-100 rounded-md border h-full flex items-center justify-center">
                                        <p className="font-semibold text-primary text-center">{project.baseTermsheetName}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contrat à Analyser</label>
                                    <div onDrop={handleFileDrop} onDragOver={(e) => e.preventDefault()} className="border-2 border-dashed border-gray-300 rounded-md h-full flex flex-col justify-center items-center text-center p-4 cursor-pointer hover:border-secondary transition-colors bg-white">
                                        {uploadedFileName ? <p className="text-green-600 font-semibold">Fichier chargé : {uploadedFileName}</p> : <p className="text-gray-500">Glissez-déposez le fichier .txt, .docx ou .pdf ici</p>}
                                    </div>
                                </div>
                            </div>
                            <div className="text-center mt-16">
                                <button onClick={handleAnalysis} disabled={isLoadingAnalysis || !uploadedContractText} className="px-8 py-3 font-semibold text-white bg-secondary rounded-md hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                                    {isLoadingAnalysis ? 'Analyse en cours...' : 'Lancer l\'analyse comparative'}
                                </button>
                            </div>
                            {isLoadingAnalysis && (
                                <div className="text-center font-semibold text-primary mt-4">Analyse en cours...</div>
                            )}
                            {analysisError && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-center">
                                    <p className="text-sm text-red-700 font-semibold">Échec de l'analyse: {analysisError}</p>
                                </div>
                            )}
                            {(analysisResult || structuredAnalysis.length > 0) && !isLoadingAnalysis && (
                                <div className="mt-8 pt-6 border-t">
                                    <h4 className="text-xl font-semibold text-gray-800 mb-4">Résultats de l'Analyse</h4>
                                    {analysisResult && (
                                        <div className="p-4 bg-gray-50 rounded-md border whitespace-pre-wrap font-mono text-sm mb-6">
                                            {analysisResult}
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        {structuredAnalysis.map((item, index) => (
                                            <div key={index} id={`analysis-item-${index}`} className="bg-white p-6 rounded-lg shadow-sm border relative">
                                                <div className="absolute top-4 right-4 flex items-center gap-1 export-actions">
                                                    <button onClick={() => handleSingleAnalysisItemExport(item, index, 'pdf')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100/50 rounded-full transition-colors" title="Exporter cet écart en PDF">
                                                        <PdfIcon />
                                                    </button>
                                                    <button onClick={() => handleSingleAnalysisItemExport(item, index, 'csv')} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-100/50 rounded-full transition-colors" title="Exporter cet écart en CSV">
                                                        <CsvIcon />
                                                    </button>
                                                </div>

                                                <div className="flex justify-between items-start gap-4 pr-24">
                                                    <h5 className="font-bold text-secondary text-lg">{item.theme}</h5>
                                                    <button
                                                        onClick={() => handleAddRiskFromAnalysis(item)}
                                                        className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white bg-secondary rounded-md hover:bg-opacity-80 transition-colors whitespace-nowrap export-actions"
                                                        title="Ajouter cet écart comme risque au tableau des risques"
                                                    >
                                                        + Ajouter au tableau
                                                    </button>
                                                </div>

                                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-gray-100">
                                                    <div>
                                                        <RiskDetail label="Position Contrat Helexia" value={item.positionNotreContrat} />
                                                        <RiskDetail label="Position Contrat Externe" value={item.positionB} />
                                                    </div>
                                                    <div>
                                                        <RiskDetail label="Analyse" value={item.analyse} />
                                                        <RiskDetail label="Niveau de Risque" value={item.niveauRisque} />
                                                        <RiskDetail label="Pistes de Négociation" value={item.negociation} />
                                                    </div>
                                                </div>
                                                <PartenaireEntrainementChat
                                                    chatHistory={item.chatHistory || []}
                                                    onSendMessage={(question) => handleSendMessage(index, question)}
                                                    isLoading={isChattingAnalysis === index}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'changements' && (
                        <div>
                             <h3 className="text-xl font-semibold text-gray-800 mb-4">Demandes de Changement</h3>
                             {projectChangeRequests.length > 0 ? (
                                <ul className="space-y-3">
                                {projectChangeRequests.map(req => (
                                    <li key={req.id} className="p-3 border rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-primary">{req.title} <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusClasses(req.status)}`}>{req.status}</span></p>
                                            <p className="text-xs text-gray-500">Date: {formatDate(req.createdAt)} | Priorité: {req.priority}</p>
                                        </div>
                                        <button onClick={() => onEditChangeRequest(req)} className="font-semibold text-secondary hover:underline text-sm">Voir/Modifier</button>
                                    </li>
                                ))}
                                </ul>
                             ) : (
                                <p className="text-sm text-gray-500">Aucune demande de changement pour ce projet.</p>
                             )}
                        </div>
                    )}
                    {activeTab === 'gouvernance' && (
                        <GovernanceMatrix />
                    )}
                </div>
            </div>
            {editingDeadline && (
                <EditDeadlineModal 
                    isOpen={!!editingDeadline}
                    onClose={() => setEditingDeadline(null)}
                    deadline={editingDeadline}
                    onSave={handleSaveDeadline}
                />
            )}
        </div>
    );
};

export default ProjectDashboard;