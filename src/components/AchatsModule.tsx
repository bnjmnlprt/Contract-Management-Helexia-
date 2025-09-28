
import React, { useState, useEffect } from 'react';
import { generateContentWithRetry } from '../utils/geminiApi';
import mammoth from 'mammoth';
import PartenaireEntrainementChat from './PartenaireEntrainementChat';
import ExportDropdown from './ExportDropdown';
import { exportElementAsPdf, exportDataAsCsv } from '../utils/export';
import type { SavedProject, RiskItem, PurchasingAction } from '../utils/types';

interface ContractTemplate {
    id: number;
    name: string;
    category: string;
    content: string;
    date: string;
}

interface StructuredAnalysisItem {
    theme: string;
    positionNotreContrat: string;
    positionB: string;
    analyse: string;
    niveauRisque: string;
    negociation: string;
    chatHistory?: Array<{ role: 'user' | 'model'; parts: string }>;
}

interface AchatsModuleProps {
    templates: ContractTemplate[];
    projects: SavedProject[];
    actions: PurchasingAction[];
    onAddRiskToProject: (projectId: string, newRisk: RiskItem) => void;
}

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
    
const AnalysisDetail: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div className="mt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-700 mt-1">{value}</p>
    </div>
);


const AchatsModule: React.FC<AchatsModuleProps> = ({ templates, projects, actions, onAddRiskToProject }) => {
    const [baseDoc, setBaseDoc] = useState<ContractTemplate | null>(null);
    const [cgvText, setCgvText] = useState('');
    const [fileName, setFileName] = useState('');
    const [analysisSummary, setAnalysisSummary] = useState('');
    const [frictionPoints, setFrictionPoints] = useState<StructuredAnalysisItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false);
    const [isChatting, setIsChatting] = useState<number | null>(null);
    const [isAddRiskModalOpen, setIsAddRiskModalOpen] = useState(false);
    const [selectedRisk, setSelectedRisk] = useState<StructuredAnalysisItem | null>(null);

    const achatsTemplates = templates.filter(t => t.category === 'Achats');

    useEffect(() => {
        if (typeof (window as any).pdfjsLib !== 'undefined') {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        }
    }, []);

    useEffect(() => {
        // Charge le premier template "Achats" par défaut au chargement
        if (achatsTemplates.length > 0 && !baseDoc) {
            setBaseDoc(achatsTemplates[0]);
        }
    }, [achatsTemplates, baseDoc]);

    const handleFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setFileName('');
        setCgvText('');
        setAnalysisSummary('');
        setFrictionPoints([]);

        const file = event.dataTransfer.files[0];
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        if (file.name.endsWith('.pdf')) {
          reader.onload = async (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            try {
              const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              let fullText = '';
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map((item: any) => item.str).join(' ');
              }
              setCgvText(fullText);
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
              setCgvText(result.value);
            } catch (error) {
              console.error("Erreur lors de la lecture du .docx :", error);
              alert("Impossible de lire le contenu de ce fichier .docx.");
            }
          };
          reader.readAsArrayBuffer(file);
        }
        else if (file.name.endsWith('.txt')) {
          reader.onload = (e) => {
            setCgvText(e.target?.result as string);
          };
          reader.readAsText(file);
        }
        else {
          setFileName('');
          alert("Erreur : Format non supporté. Veuillez déposer un fichier .txt, .docx ou .pdf.");
        }
    };

    const handleAnalysis = async () => {
        if (!cgvText || !baseDoc) {
          alert('Veuillez déposer les CGV du fournisseur et vous assurer qu\'un document de référence est sélectionné.');
          return;
        }
        setIsLoading(true);
        setAnalysisSummary('');
        setFrictionPoints([]);
        setAnalysisError(null);

        try {
            const prompt = `Tu es un expert en droit des affaires et achats pour la société Helexia, spécialisée en projets énergétiques. Tu analyses les Conditions Générales de Vente (CGV) d'un fournisseur par rapport aux Conditions Générales d'Achat (CGA) de Helexia.
    
DOCUMENT A (Nos CGA - HELEXIA) :
---
${baseDoc.content}
---

DOCUMENT B (CGV du fournisseur) :
---
${cgvText}
---

MISSION :
1.  **Synthèse Globale** : Rédige une synthèse concise (3-4 phrases) évaluant le niveau de risque global (Faible, Moyen, Élevé) en comparant le document B au document A. Pointe les 2-3 points de friction les plus importants (ex: responsabilité, paiement, propriété intellectuelle).

2.  **Tableau des Écarts** : Identifie les 10 écarts les plus critiques entre les deux documents. Pour chaque écart, structure ta réponse au format JSON STRICT suivant, sans aucun texte avant ou après le tableau JSON :

[
  {
    "theme": "Titre du point de friction (ex: Conditions de paiement)",
    "positionNotreContrat": "Citation exacte ou résumé très court de notre clause dans le document A (CGA).",
    "positionB": "Citation exacte ou résumé très court de la clause correspondante dans le document B (CGV).",
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

            setAnalysisSummary(summary);
            setFrictionPoints(structuredData);
            setAnalysisError(null);
        } catch (error) {
            console.error("Erreur lors de l'analyse:", error);
            setAnalysisError(error instanceof Error ? error.message : "Une erreur inconnue est survenue");
            setAnalysisSummary('');
            setFrictionPoints([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (itemIndex: number, question: string) => {
        const currentItem = frictionPoints[itemIndex];
        if (!currentItem) return;
        
        const updatedChatHistory = [...(currentItem.chatHistory || []), { role: 'user' as const, parts: question }];
        const updatedAnalysis = frictionPoints.map((item, index) => 
          index === itemIndex ? { ...item, chatHistory: updatedChatHistory } : item
        );
        setFrictionPoints(updatedAnalysis);
        setIsChatting(itemIndex);
        
        const contextualPrompt = `
        Tu agis comme un partenaire d'entraînement nommé "WWCD (What Would Christophe Do?)". Ta mission est d'aider un expert en achats à affiner sa stratégie de négociation concernant un point de friction entre ses Conditions Générales d'Achat (CGA) et les Conditions Générales de Vente (CGV) d'un fournisseur.
        **CONTEXTE INITIAL DE L'ÉCART :**
        - Thème : ${currentItem.theme}
        - Analyse du Risque : ${currentItem.analyse}
        - Pistes de négociation initiales : ${currentItem.negociation}
        
        **HISTORIQUE DE VOTRE CONVERSATION :**
        ${updatedChatHistory.map(msg => `${msg.role === 'user' ? 'Acheteur' : 'WWCD'}: ${msg.parts}`).join('\n')}
        
        **MISSION :**
        En te basant sur le contexte et l'historique, réponds de manière concise et pertinente à la dernière question de l'acheteur pour l'aider dans sa négociation. Sois direct et propose des solutions concrètes.
        `;
        
        try {
          const response = await generateContentWithRetry({
              model: 'gemini-2.5-flash',
              contents: contextualPrompt
          });
          const responseText = response.text;
          
          const finalChatHistory = [...updatedChatHistory, { role: 'model' as const, parts: responseText }];
          setFrictionPoints(currentAnalysis => currentAnalysis.map((item, index) =>
            index === itemIndex ? { ...item, chatHistory: finalChatHistory } : item
          ));
          
        } catch (error) {
          console.error("Erreur lors de l'appel à WWCD :", error);
          const errorMessage = error instanceof Error ? error.message : "Désolé, une erreur de communication est survenue.";
          const errorChatHistory = [...updatedChatHistory, { role: 'model' as const, parts: errorMessage }];
          setFrictionPoints(currentAnalysis => currentAnalysis.map((item, index) =>
            index === itemIndex ? { ...item, chatHistory: errorChatHistory } : item
          ));
        } finally {
            setIsChatting(null);
        }
    };

    const handleAnalysisPdfExport = () => {
        exportElementAsPdf(
            'contract-analysis-export-area',
            `helexia_analyse_achats_${baseDoc?.name.replace(/\s+/g, '_')}.pdf`,
            '.export-actions'
        );
    };

    const handleAnalysisCsvExport = () => {
        const dataToExport = frictionPoints.map(item => ({
            'Thème': item.theme,
            'Position (Notre Contrat)': item.positionNotreContrat,
            'Position (CGV Fournisseur)': item.positionB,
            "Analyse de l'Écart": item.analyse,
            'Niveau de Risque': item.niveauRisque,
            'Pistes de Négociation': item.negociation,
        }));
        exportDataAsCsv(
            dataToExport,
            `helexia_analyse_achats_${baseDoc?.name.replace(/\s+/g, '_')}_vs_${fileName.replace(/\s+/g, '_')}.csv`
        );
    };

    const handleSingleAnalysisItemExport = (item: StructuredAnalysisItem, index: number, format: 'pdf' | 'csv') => {
        const safeTheme = item.theme.substring(0, 20).replace(/\s+/g, '_');
        const fileName = `helexia_analyse_achats_${safeTheme}`;

        if (format === 'csv') {
            const itemData = {
                'ID': index + 1,
                'Thème': item.theme,
                'Position (Notre Contrat)': item.positionNotreContrat,
                'Position (CGV Fournisseur)': item.positionB,
                "Analyse de l'Écart": item.analyse,
                'Niveau de Risque': item.niveauRisque,
                'Pistes de Négociation': item.negociation,
            };
            exportDataAsCsv([itemData], `${fileName}.csv`);
        } else {
            exportElementAsPdf(`analysis-item-${index}`, `${fileName}.pdf`, '.export-actions');
        }
    };

    const handleSelectTemplate = (template: ContractTemplate) => {
        setBaseDoc(template);
        setSelectionModalOpen(false);
    };

    const openAddRiskModal = (item: StructuredAnalysisItem) => {
        setSelectedRisk(item);
        setIsAddRiskModalOpen(true);
    };

    const handleSelectProjectAndAddRisk = (projectId: string) => {
        if (!selectedRisk) return;

        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        
        const newRisk: RiskItem = {
            uid: `risk-achats-${Date.now()}`,
            id: `R-ACH-${(project.risks.length + 1).toString().padStart(3, '0')}`,
            projet: project.projectName,
            risque: selectedRisk.theme,
            typeRisque: 'Contractuel / Achat',
            description: `Écart identifié via l'analyse Achats : ${selectedRisk.analyse}`,
            coutProbableMaximal: null,
            probabiliteAvant: 75,
            explicationCalcul: `Risque basé sur la position du fournisseur : "${selectedRisk.positionB}"`,
            mitigationActions: selectedRisk.negociation ? [{ id: `action-${Date.now()}`, description: selectedRisk.negociation, dueDate: null, status: 'À Faire' }] : [],
            coutMitigation: null,
            probabiliteApres: null,
        };

        onAddRiskToProject(projectId, newRisk);
        setIsAddRiskModalOpen(false);
        setSelectedRisk(null);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 lg:p-8">
            <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-primary">Module Achats</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nos CGA (Document de Référence)</label>
                  <div onClick={() => setSelectionModalOpen(true)} className="p-4 bg-gray-100 rounded-md border h-full flex flex-col justify-center cursor-pointer hover:border-secondary">
                    <p className="font-semibold text-primary text-center">{baseDoc?.name || 'Sélectionner un contrat'}</p>
                    <p className="text-xs text-gray-400 text-center mt-1">(Cliquez pour changer)</p>
                  </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Document Fournisseur (à analyser)</label>
                    <div
                        onDrop={handleFileDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="border-2 border-dashed border-gray-300 rounded-md h-full flex flex-col justify-center items-center text-center p-4 cursor-pointer hover:border-secondary transition-colors bg-white"
                    >
                        {fileName ? (
                            <p className="text-green-600 font-semibold">Fichier chargé : {fileName}</p>
                        ) : (
                            <div>
                                <p className="text-gray-500">Glissez-déposez le fichier .txt, .docx ou .pdf des CGV ici</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-center mb-6 mt-16">
                <button
                    onClick={handleAnalysis}
                    disabled={isLoading || !cgvText || !baseDoc}
                    className="px-8 py-3 font-semibold text-white bg-secondary rounded-md hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Analyse en cours...' : 'Analyser les points de friction'}
                </button>
            </div>

            {analysisError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-center">
                    <p className="text-sm text-red-700 font-semibold">Échec de l'analyse</p>
                    <p className="text-sm text-red-600 mt-1">{analysisError}</p>
                </div>
            )}

             {isLoading && (
                <div className="text-center font-semibold text-primary mt-4 flex items-center justify-center">
                    <svg className="animate-spin h-6 w-6 text-secondary mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyse en cours, veuillez patienter...
                </div>
            )}

            {(analysisSummary || frictionPoints.length > 0) && !isLoading && (
                <div id="contract-analysis-export-area" className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold text-primary">Résultat de l'analyse</h3>
                        <div className="export-actions">
                            <ExportDropdown
                                onPdfExport={handleAnalysisPdfExport}
                                onExcelExport={handleAnalysisCsvExport}
                                disabled={frictionPoints.length === 0}
                            />
                        </div>
                    </div>

                    {analysisSummary && (
                        <div className="p-4 bg-gray-50 rounded-md border mb-8">
                           <div className="p-4 bg-gray-50 rounded-md border whitespace-pre-wrap font-mono text-sm">
                                {analysisSummary}
                           </div>
                        </div>
                    )}
                    {frictionPoints.length > 0 && (
                        <div className="space-y-6">
                            <h4 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-4">Écarts Majeurs Identifiés</h4>
                            {frictionPoints.map((item, index) => (
                                <div key={index} id={`analysis-item-${index}`} className="bg-white p-4 rounded-md border shadow-sm relative">
                                    <div className="absolute top-2 right-2 flex items-center gap-1 export-actions">
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
                                            onClick={() => openAddRiskModal(item)}
                                            className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-white bg-secondary rounded-md hover:bg-opacity-80 transition-colors whitespace-nowrap export-actions disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            title={projects.length === 0 ? "Créez un projet pour ajouter un risque" : "Ajouter cet écart comme risque à un projet"}
                                            disabled={projects.length === 0}
                                        >
                                            + Ajouter à un projet
                                        </button>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-gray-100">
                                        <div>
                                            <AnalysisDetail label="Position (Notre Contrat)" value={item.positionNotreContrat} />
                                            <AnalysisDetail label="Position (CGV Fournisseur)" value={item.positionB} />
                                        </div>
                                        <div>
                                            <AnalysisDetail label="Analyse de l'Écart" value={item.analyse} />
                                            <AnalysisDetail label="Niveau de Risque" value={item.niveauRisque} />
                                            <AnalysisDetail label="Pistes de Négociation" value={item.negociation} />
                                        </div>
                                    </div>
                                    <PartenaireEntrainementChat
                                        chatHistory={item.chatHistory || []}
                                        onSendMessage={(question) => handleSendMessage(index, question)}
                                        isLoading={isChatting === index}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {isSelectionModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                  <h3 className="text-xl font-semibold text-primary mb-4">Sélectionner un Document de Référence</h3>
                  <ul className="space-y-2">
                    {achatsTemplates.map(template => (
                      <li key={template.id} onClick={() => handleSelectTemplate(template)} className="p-3 bg-gray-50 rounded-md border cursor-pointer hover:bg-secondary/10 hover:border-secondary">
                        <p className="font-semibold">{template.name}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="text-right mt-4">
                     <button onClick={() => setSelectionModalOpen(false)} className="px-4 py-2 text-sm bg-gray-200 rounded-md">Annuler</button>
                  </div>
                </div>
              </div>
            )}
            {isAddRiskModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" aria-modal="true" role="dialog">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h3 className="text-xl font-semibold text-primary mb-4">Sélectionner un projet</h3>
                        <p className="text-sm text-gray-600 mb-4">Veuillez choisir le projet auquel vous souhaitez ajouter ce risque.</p>
                        <ul className="space-y-2 max-h-80 overflow-y-auto border-t border-b py-2">
                            {projects.map(project => (
                                <li key={project.id} onClick={() => handleSelectProjectAndAddRisk(project.id)} className="p-3 bg-gray-50 rounded-md border cursor-pointer hover:bg-secondary/10 hover:border-secondary transition-colors">
                                    <p className="font-semibold text-primary">{project.projectName}</p>
                                    <p className="text-xs text-gray-500">{project.projectCode}</p>
                                </li>
                            ))}
                        </ul>
                        <div className="flex justify-end items-center mt-6 pt-4">
                            <button onClick={() => { setIsAddRiskModalOpen(false); setSelectedRisk(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Annuler</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold text-primary mb-4">Actions d'Achat à Suivre</h3>
              {actions.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune action d'achat en attente.</p>
              ) : (
                <ul className="space-y-3">
                  {actions.map(action => (
                    <li key={action.id} className="p-3 bg-gray-50 rounded-md border">
                      <p className="font-semibold">{action.actionDescription}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Lié à la demande de changement "{action.changeRequestTitle}" sur le projet "{action.projectName}"
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
        </div>
    );
};

export default AchatsModule;