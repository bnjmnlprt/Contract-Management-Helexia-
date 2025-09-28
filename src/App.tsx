import React, { useState, useEffect } from 'react';
import ProjectList from './components/ProjectList';
import ProjectDashboard from './components/ProjectDashboard';
import NewProjectModal from './components/NewProjectModal';
import Parametres from './components/Parametres';
import AchatsModule from './components/AchatsModule';
import ChangeManagementModule from './components/ChangeManagementModule';
import NewChangeRequestModal from './components/NewChangeRequestModal';
import DisputeDashboard from './components/DisputeDashboard';
import DisputeDetailPage from './components/DisputeDetailPage';
import DisputeModal from './components/DisputeModal';
import type { SavedProject, RiskItem, CalculatorInputs, FullCalculationResults, ContractDeadline, ChangeRequest, PurchasingAction, Amendment, Dispute } from './utils/types';
import { generateContentWithRetry } from './utils/geminiApi';

type ActiveView = 'list' | 'project' | 'settings' | 'achats' | 'changes' | 'disputes' | 'disputeDetail';

interface Template {
  id: number;
  name: string;
  category: string;
  content: string;
  date: string;
}

const Header: React.FC<{ onNavigate: (view: ActiveView) => void; activeView: ActiveView }> = ({ onNavigate, activeView }) => {
    const navLinkClasses = (view: ActiveView) => 
        `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeView === view ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-200'
        }`;

    return (
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('list')}>
            <img src="https://www.helexia.green/wp-content/uploads/2023/12/helexia-logo-header.svg" alt="Helexia Logo" className="h-8" />
            <span className="text-3xl text-gray-200 font-light mx-4">|</span>
            <h1 className="text-2xl text-primary font-semibold">Outil de Contract Management</h1>
          </div>
          <nav className="flex items-center space-x-2">
              <button onClick={() => onNavigate('list')} className={navLinkClasses('list')}>Projets</button>
              <button onClick={() => onNavigate('achats')} className={navLinkClasses('achats')}>Achats</button>
              <button onClick={() => onNavigate('changes')} className={navLinkClasses('changes')}>Changements</button>
              <button onClick={() => onNavigate('disputes')} className={navLinkClasses('disputes')}>Litiges</button>
              <button onClick={() => onNavigate('settings')} className={navLinkClasses('settings')}>Paramètres</button>
          </nav>
        </div>
      </header>
    );
};

const Footer: React.FC = () => (
    <footer className="text-center py-6 mt-10 bg-white border-t border-gray-200 text-sm text-gray-600">
        &copy; {new Date().getFullYear()} Helexia. Tous droits réservés.
    </footer>
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

const App: React.FC = () => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('list');
  const [activeProject, setActiveProject] = useState<SavedProject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuggestingRisks, setIsSuggestingRisks] = useState(false);
  const [contractTemplates, setContractTemplates] = useState<Template[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [isNewChangeModalOpen, setIsNewChangeModalOpen] = useState(false);
  const [editingChangeRequest, setEditingChangeRequest] = useState<ChangeRequest | null>(null);
  const [purchasingActions, setPurchasingActions] = useState<PurchasingAction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [editingDispute, setEditingDispute] = useState<Dispute | null>(null);

  useEffect(() => {
      const fetchTemplates = async () => {
          const templateFiles = {
              'epc_contract.txt': { category: 'PV', name: 'HLXFR_S4_FOR-0XX_V2_ PV_EPC_OM_MODELE_TYPE_HELEXIA_VENTE_maj2025-07-16' },
              'IPP_Autoconso.txt': { category: 'PV', name: 'HLXFR_S4_FOR-0XX_V3_ PV_CMAD_MODELE_TYPE_HELEXIA_VENTE_maj2025-07-16' },
              'PV_LOI_INJECTION_RESEAU_2025-05-20.txt': { category: 'PV', name: 'HLXFR_S4_FOR-0XX_V1_ PV_LOI_INJECTION_RESEAU_maj2025-05-20' },
              'CADRE_TRAVAUX_2025-07-24.txt': { category: 'Achats', name: 'HLXFR_S4_FOR-0XX_V1_ ACHATS_CADRE_TRAVAUX_maj2025-07-24' },
              'APPLICATION_TRAVAUX_2025-07-24.txt': { category: 'Achats', name: 'HLXFR_S4_FOR-0XX_V1_ ACHATS_APP_TRAVAUX_maj2025-07-24' },
              'AMO_GTB_2024-12-05.txt': { category: 'SEED', name: 'HLXFR_S4_FOR-0XX_V1_ SEED_AMO_GTB_maj2024-12-05' },
              'EPC_CVC_2025-08-26.txt': { category: 'SEED', name: 'HLXFR_S4_FOR-0XX_V1_ SEED_EPC_CVC_maj2025-08-26' },
              'EMS_Froid.txt': { category: 'SEED', name: 'HLXFR_S4_FOR-0XX_V1_ SEED_EMS-FROID_maj2025-07-16' },
              'CGV_maj2025-07-01.txt': { category: 'SEED', name: 'HLXFR_S4_FOR-0XX_V1_ SEED_CGV_maj2025-07-01' },
              'CGA_2025-07-01.txt': { category: 'Achats', name: 'HLXFR_S4_FOR-0XX_V1_ ACHATS_CGA_maj2025-07-01' },
              'ccag_pi_30_03_2021.txt': { category: 'SEED', name: 'Services - Prestation Intellectuelle AO Public' },
              'ccag_travaux_30_03_2021.txt': { category: 'SEED', name: 'Services - Travaux AO Public' },
          };

          const loadedTemplates = await Promise.all(
              Object.entries(templateFiles).map(async ([fileName, data], index) => {
                  try {
                      const response = await fetch(`/src/contracts/${fileName}`);
                      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                      const content = await response.text();
                      const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
                      const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
                      return { id: index + 1, name: data.name, category: data.category, content, date };
                  } catch (e) {
                      console.error(`Failed to load template: ${fileName}`, e);
                      return null;
                  }
              })
          );
          setContractTemplates(loadedTemplates.filter((t): t is Template => t !== null));
      };
      fetchTemplates();
  }, []);

  useEffect(() => {
    try {
      const savedProjectsJSON = localStorage.getItem('savedProjects');
      if (savedProjectsJSON) {
        let loadedProjects = JSON.parse(savedProjectsJSON);
        
        // Script de migration
        loadedProjects.forEach((project: any) => {
            if (project.risks) {
                project.risks.forEach((risk: any) => {
                    // Migration pour les actions de mitigation
                    if (typeof risk.mitigation === 'string' && risk.mitigation) {
                        risk.mitigationActions = [{
                            id: `action-${Date.now()}-${Math.random()}`,
                            description: risk.mitigation,
                            dueDate: null,
                            status: 'À Faire'
                        }];
                    }
                    else if (!risk.mitigationActions) {
                        risk.mitigationActions = [];
                    }
                    delete risk.mitigation;
                });
            }
        });
        
        setProjects(loadedProjects);
      }
      const savedChangesJSON = localStorage.getItem('savedChangeRequests');
      if (savedChangesJSON) {
        setChangeRequests(JSON.parse(savedChangesJSON));
      }
      const savedActions = localStorage.getItem('savedPurchasingActions');
      if (savedActions) setPurchasingActions(JSON.parse(savedActions));
      
      const savedDisputesJSON = localStorage.getItem('savedDisputes');
      if (savedDisputesJSON) {
        setDisputes(JSON.parse(savedDisputesJSON));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (projects.length > 0 && contractTemplates.length > 0) {
        const needsMigration = projects.some(p => !p.baseTermsheetName || !p.baseTermsheet);
        if (needsMigration) {
            console.log("Migration des anciens projets en cours...");

            const templateMap: { [key in SavedProject['projectType']]?: string } = {
                'EPC': 'HLXFR_S4_FOR-0XX_V2_ PV_EPC_OM_MODELE_TYPE_HELEXIA_VENTE_maj2025-07-16',
                'IPP Autoconsommation': 'HLXFR_S4_FOR-0XX_V3_ PV_CMAD_MODELE_TYPE_HELEXIA_VENTE_maj2025-07-16',
                'PV Injection': 'HLXFR_S4_FOR-0XX_V1_ PV_LOI_INJECTION_RESEAU_maj2025-05-20',
                'EPC CVC': 'HLXFR_S4_FOR-0XX_V1_ SEED_EPC_CVC_maj2025-08-26',
                'AMO': 'HLXFR_S4_FOR-0XX_V1_ SEED_AMO_GTB_maj2024-12-05',
                'EMS-Froid': 'HLXFR_S4_FOR-0XX_V1_ SEED_EMS-FROID_maj2025-07-16',
                'Audit': 'HLXFR_S4_FOR-0XX_V1_ SEED_CGV_maj2025-07-01',
                'Prestation Intellectuelle AO Public': 'Services - Prestation Intellectuelle AO Public',
                'Travaux AO Public': 'Services - Travaux AO Public',
            };
            
            const migratedProjects = projects.map(p => {
              if ((!p.baseTermsheetName || !p.baseTermsheet) && p.projectType) {
                const templateName = templateMap[p.projectType];
                const template = contractTemplates.find(t => t.name === templateName);
                if (template) {
                  return { ...p, baseTermsheet: template.content, baseTermsheetName: template.name };
                }
              }
              return p;
            });
            setProjects(migratedProjects);
        }
    }
  }, [projects, contractTemplates]);

  useEffect(() => {
    try {
        localStorage.setItem('savedProjects', JSON.stringify(projects));
    } catch (error) {
        console.error("Failed to save projects to localStorage", error);
    }
  }, [projects]);

  useEffect(() => {
    try {
        localStorage.setItem('savedChangeRequests', JSON.stringify(changeRequests));
    } catch (error) {
        console.error("Failed to save change requests to localStorage", error);
    }
  }, [changeRequests]);

  useEffect(() => {
    try {
        localStorage.setItem('savedPurchasingActions', JSON.stringify(purchasingActions));
    } catch (error) {
        console.error("Failed to save purchasing actions to localStorage", error);
    }
}, [purchasingActions]);

  useEffect(() => {
    try {
        localStorage.setItem('savedDisputes', JSON.stringify(disputes));
    } catch (error) {
        console.error("Failed to save disputes to localStorage", error);
    }
  }, [disputes]);

  const handleNewProject = (name: string, code: string, address: string, type: SavedProject['projectType']) => {
      if (contractTemplates.length === 0) {
          alert("Les modèles de contrats ne sont pas encore chargés. Veuillez réessayer dans un instant.");
          return;
      }
      const templateMap: { [key in SavedProject['projectType']]?: string } = {
        'EPC': 'HLXFR_S4_FOR-0XX_V2_ PV_EPC_OM_MODELE_TYPE_HELEXIA_VENTE_maj2025-07-16',
        'IPP Autoconsommation': 'HLXFR_S4_FOR-0XX_V3_ PV_CMAD_MODELE_TYPE_HELEXIA_VENTE_maj2025-07-16',
        'PV Injection': 'HLXFR_S4_FOR-0XX_V1_ PV_LOI_INJECTION_RESEAU_maj2025-05-20',
        'EPC CVC': 'HLXFR_S4_FOR-0XX_V1_ SEED_EPC_CVC_maj2025-08-26',
        'AMO': 'HLXFR_S4_FOR-0XX_V1_ SEED_AMO_GTB_maj2024-12-05',
        'EMS-Froid': 'HLXFR_S4_FOR-0XX_V1_ SEED_EMS-FROID_maj2025-07-16',
        'Audit': 'HLXFR_S4_FOR-0XX_V1_ SEED_CGV_maj2025-07-01',
        'Prestation Intellectuelle AO Public': 'Services - Prestation Intellectuelle AO Public',
        'Travaux AO Public': 'Services - Travaux AO Public',
      };
      const templateName = templateMap[type];
      const template = contractTemplates.find(t => t.name === templateName);
      if (!template) {
        alert(`Erreur : Impossible de trouver le modèle de contrat pour le type "${type}".`);
        return;
      }
      const newProject: SavedProject = {
        id: `proj-${Date.now()}`,
        projectName: name,
        projectCode: code,
        projectAddress: address,
        projectType: type,
        status: 'O5',
        projectUrl: '',
        baseTermsheet: template.content,
        baseTermsheetName: template.name,
        inputs: BLANK_INPUTS,
        results: BLANK_RESULTS,
        risks: [],
        deadlines: [],
        savedAt: new Date().toISOString(),
      };
      setProjects(prev => [newProject, ...prev]);
      setActiveProject(newProject);
      setIsModalOpen(false);
      setActiveView('project');
  };

  const handleUpdateProject = (projectId: string, updatedData: Partial<SavedProject>) => {
    const updatedProjects = projects.map(p => 
      p.id === projectId ? { ...p, ...updatedData, savedAt: new Date().toISOString() } : p
    );
    setProjects(updatedProjects);
    // Met aussi à jour le projet actif s'il est celui qui est modifié
    if (activeProject?.id === projectId) {
      setActiveProject(prev => prev ? { ...prev, ...updatedData } : null);
    }
  };

  const handleSaveProject = (inputs: CalculatorInputs, results: FullCalculationResults) => {
    if (!activeProject) return;

    // Filtre pour enlever l'ancien risque de pénalité avant d'ajouter le nouveau
    let updatedRisks = activeProject.risks.filter(r => r.risque !== 'Pénalités de retard');
    let newPenaltyRisk: RiskItem;

    if (inputs.calculationMode === 'seed') {
        newPenaltyRisk = {
            uid: `risk-penalty-${activeProject.id}`,
            id: `R-PEN-${activeProject.projectCode || 'XXX'}`,
            projet: activeProject.projectName,
            risque: 'Pénalités de retard',
            typeRisque: 'Financier / Contractuel (SEED)',
            description: `Risque de pénalités pour retard sur un projet de type SEED, calculées en pourcentage du marché.`,
            coutProbableMaximal: results.plafondMontantSeed || 0,
            probabiliteAvant: 75, // Probabilité par défaut
            explicationCalcul: `Taux journalier: ${inputs.tauxPenaliteJournalier}%. Montant marché: ${inputs.montantMarche?.toLocaleString('fr-FR')}€. Plafond: ${inputs.plafondPenalitesPourcentage}% (${results.plafondMontantSeed?.toLocaleString('fr-FR')}€).`,
            mitigationActions: [],
            coutMitigation: null,
            probabiliteApres: 25, // Probabilité par défaut
        };
    } else { // Mode 'pv' par défaut
        const penaltyValue = Math.ceil(results.totalImpactJournalier);
        newPenaltyRisk = {
            uid: `risk-penalty-${activeProject.id}`,
            id: `R-PEN-${activeProject.projectCode || 'XXX'}`,
            projet: activeProject.projectName,
            risque: 'Pénalités de retard',
            typeRisque: 'Financier / Contractuel (PV)',
            description: 'Risque de pénalités dues à un retard de livraison imputable à Helexia.',
            coutProbableMaximal: results.plafondValeur,
            probabiliteAvant: 75, // Probabilité par défaut
            explicationCalcul: `Pénalité journalière: ${penaltyValue.toLocaleString('fr-FR')}€. Plafond: ${inputs.capPercentage}% (${results.plafondValeur.toLocaleString('fr-FR')}€).`,
            mitigationActions: [],
            coutMitigation: null,
            probabiliteApres: 25, // Probabilité par défaut
        };
    }
    
    updatedRisks.push(newPenaltyRisk);
    
    const updatedProject: SavedProject = {
      ...activeProject,
      inputs,
      results,
      risks: updatedRisks,
      savedAt: new Date().toISOString(),
    };
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    setActiveProject(updatedProject);
    alert('Projet mis à jour avec succès ! Le risque de pénalité a été ajouté/mis à jour.');
  };
  
  const handleUpdateRisks = (risks: RiskItem[]) => {
    if (!activeProject) return;
    const updatedProject = { ...activeProject, risks, savedAt: new Date().toISOString() };
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    setActiveProject(updatedProject);
  };
  
  const handleUpdateDeadlines = (deadlines: ContractDeadline[]) => {
    if (!activeProject) return;
    const updatedProject: SavedProject = { ...activeProject, deadlines, savedAt: new Date().toISOString() };
    setProjects(projects.map(p => (p.id === updatedProject.id ? updatedProject : p)));
    setActiveProject(updatedProject);
};

  const handleViewProject = (id: string) => {
    const projectToView = projects.find(p => p.id === id);
    if (projectToView) {
        setActiveProject(projectToView);
        setActiveView('project');
    }
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      setProjects(projects.filter(p => p.id !== id));
      if (activeProject?.id === id) {
          setActiveProject(null);
          setActiveView('list');
      }
    }
  };

  const handleSuggestRisks = async (contractType: string): Promise<boolean> => {
    if (!activeProject) return false;
    setIsSuggestingRisks(true);
    try {
        const prompt = `Génère 5 risques typiques pour un projet ${contractType} dans le secteur énergétique.\nFormat JSON strict : [{"risque": "nom", "typeRisque": "catégorie", "description": "détails"}]\nRéponds UNIQUEMENT avec le tableau JSON, rien d'autre.`;

        const response = await generateContentWithRetry({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const responseText = response.text.trim();
        
        // Gemini can sometimes wrap the JSON in ```json ... ```. This regex handles both cases.
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```|(\[[\s\S]*\])/s);
        if (!jsonMatch) {
            console.error("Raw IA response:", responseText);
            throw new Error("La réponse de l'IA ne contient pas de JSON valide.");
        }
        const jsonString = jsonMatch[1] || jsonMatch[2];

        const suggestedRisks = JSON.parse(jsonString);

        if (!Array.isArray(suggestedRisks)) {
            throw new Error("La réponse de l'IA n'est pas un tableau JSON.");
        }

        const newRisks: RiskItem[] = suggestedRisks.map((item: any, index: number) => ({
            uid: `risk-ia-${Date.now()}-${index}`,
            id: `R${(activeProject.risks.length + index + 1).toString().padStart(3, '0')}`,
            projet: activeProject.projectName,
            risque: item.risque || 'Risque non défini',
            typeRisque: item.typeRisque || 'Type non défini',
            description: item.description || 'Description non définie',
            coutProbableMaximal: null,
            probabiliteAvant: null,
            explicationCalcul: '',
            mitigationActions: [],
            coutMitigation: null,
            probabiliteApres: null,
        }));

        const updatedProject = {
            ...activeProject,
            risks: [...activeProject.risks, ...newRisks],
            savedAt: new Date().toISOString()
        };

        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
        setActiveProject(updatedProject);

        return true;
    } catch (error) {
        console.error("Erreur lors de la suggestion de risques:", error);
        alert(`Erreur de l'IA: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    } finally {
        setIsSuggestingRisks(false);
    }
  };

  const handleAddRiskToProject = (projectId: string, newRisk: RiskItem) => {
    setProjects(prevProjects => {
        const projectToUpdate = prevProjects.find(p => p.id === projectId);
        if (!projectToUpdate) return prevProjects;

        if (projectToUpdate.risks.some(r => r.risque === newRisk.risque)) {
            alert(`Le risque "${newRisk.risque}" existe déjà pour le projet "${projectToUpdate.projectName}".`);
            return prevProjects;
        }

        const updatedProjects = prevProjects.map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    risks: [...p.risks, newRisk],
                    savedAt: new Date().toISOString()
                };
            }
            return p;
        });

        alert(`Le risque "${newRisk.risque}" a été ajouté au projet "${projectToUpdate.projectName}" !`);
        return updatedProjects;
    });
  };

  const handleOpenChangeModal = (req: ChangeRequest | null) => {
    setEditingChangeRequest(req); // Si req est null, c'est une création. Sinon, c'est une modification.
    setIsNewChangeModalOpen(true);
  };

  const handleCreatePurchasingAction = (changeRequest: ChangeRequest, description: string) => {
    const newAction: PurchasingAction = {
      id: `pa-${Date.now()}`,
      changeRequestId: changeRequest.id,
      changeRequestTitle: changeRequest.title,
      projectId: changeRequest.projectId,
      projectName: changeRequest.projectName,
      actionDescription: description,
      status: 'À faire',
      createdAt: new Date().toISOString(),
    };
    setPurchasingActions(prev => [newAction, ...prev]);
  };

  const handleSaveChangeRequest = (data: Partial<ChangeRequest>) => {
    let updatedRequest: ChangeRequest | undefined;
    if (editingChangeRequest) { // Mode Modification
      updatedRequest = { ...editingChangeRequest, ...data } as ChangeRequest;
      setChangeRequests(prev => prev.map(req => req.id === editingChangeRequest.id ? updatedRequest! : req));
      
      // --- DÉBUT DE LA LOGIQUE AUTOMATIQUE ---
      const oldStatus = editingChangeRequest.status;
      const newStatus = updatedRequest.status;
      // Si le statut passe à "Approuvé" et que la case est cochée
      if (newStatus === 'Approuvé' && oldStatus !== 'Approuvé' && updatedRequest.hasPurchasingImpact) {
        const actionDesc = `Suivi des achats requis pour la demande : "${updatedRequest.title}"`;
        handleCreatePurchasingAction(updatedRequest, actionDesc);
      }
      // --- FIN DE LA LOGIQUE AUTOMATIQUE ---
    } else { // Mode Création
      const project = projects.find(p => p.id === data.projectId);
      if (!project) {
          console.error("Projet non trouvé pour la nouvelle demande de changement");
          return;
      }
      const projectChangeRequests = changeRequests.filter(req => req.projectId === data.projectId);
      const newChangeNumber = `CHG-${project.projectCode}-${(projectChangeRequests.length + 1).toString().padStart(3, '0')}`;
      
      updatedRequest = {
        id: `change-${Date.now()}`,
        status: 'Demandé',
        createdAt: new Date().toISOString(),
        changeNumber: newChangeNumber,
        projectName: project.projectName,
        projectCode: project.projectCode,
        contractRef: project.baseTermsheetName,
        requester: 'Interne',
        amendments: [],
        ...data
      } as ChangeRequest;
      setChangeRequests(prev => [...prev, updatedRequest!]);
    }
    setIsNewChangeModalOpen(false);
    setEditingChangeRequest(null);
  };

    const handleAddAmendment = (changeRequestId: string, amendmentData: Omit<Amendment, 'id'>) => {
      const newAmendment: Amendment = {
        id: `amend-${Date.now()}`,
        ...amendmentData,
      };
      setChangeRequests(prevReqs => 
        prevReqs.map(req => {
          if (req.id === changeRequestId) {
            const updatedAmendments = [...(req.amendments || []), newAmendment];
            return { ...req, amendments: updatedAmendments };
          }
          return req;
        })
      );
    };

    const handleOpenDisputeModal = (dispute: Dispute | null) => {
        setEditingDispute(dispute);
        setIsDisputeModalOpen(true);
    };
    
    const handleSaveDispute = (data: Partial<Dispute>) => {
      if (editingDispute) { // Mode Modification
        const updatedDispute = { ...editingDispute, ...data } as Dispute;
        setDisputes(prev => prev.map(d => d.id === editingDispute.id ? updatedDispute : d));
        if (activeDispute?.id === editingDispute.id) {
          setActiveDispute(updatedDispute);
        }
      } else { // Mode Création
        const newDispute: Dispute = {
          id: `dispute-${Date.now()}`,
          status: 'Ouvert',
          startDate: new Date().toISOString(),
          ...data
        } as Dispute;
        setDisputes(prev => [newDispute, ...prev]);
      }
      setIsDisputeModalOpen(false);
      setEditingDispute(null);
    };

    const handleViewDispute = (dispute: Dispute) => {
        setActiveDispute(dispute);
        setActiveView('disputeDetail');
    };

  const renderContent = () => {
      switch(activeView) {
          case 'project':
              return activeProject ? (
                  <ProjectDashboard 
                      project={activeProject}
                      changeRequests={changeRequests}
                      onSaveChanges={handleSaveProject}
                      onUpdateRisks={handleUpdateRisks}
                      onUpdateDeadlines={handleUpdateDeadlines}
                      onSuggestRisks={handleSuggestRisks}
                      isSuggesting={isSuggestingRisks}
                      onBackToList={() => {
                          setActiveProject(null);
                          setActiveView('list');
                      }}
                      onNewRequest={() => handleOpenChangeModal(null)}
                      onEditChangeRequest={handleOpenChangeModal}
                      onUpdateProject={handleUpdateProject}
                  />
              ) : <ProjectList projects={projects} changeRequests={changeRequests} onView={handleViewProject} onDelete={handleDeleteProject} onNewProject={() => setIsModalOpen(true)} />;
          case 'settings':
              return <Parametres templates={contractTemplates} />;
          case 'achats':
              return <AchatsModule 
                        templates={contractTemplates} 
                        projects={projects}
                        actions={purchasingActions}
                        onAddRiskToProject={handleAddRiskToProject}
                    />;
          case 'changes':
              return <ChangeManagementModule 
                        changeRequests={changeRequests} 
                        projects={projects}
                        purchasingActions={purchasingActions}
                        onNewRequest={() => handleOpenChangeModal(null)}
                        onEditRequest={handleOpenChangeModal} 
                    />;
          case 'disputes':
              return <DisputeDashboard disputes={disputes} onSelectDispute={handleViewDispute} onNewDispute={() => handleOpenDisputeModal(null)} />;
          case 'disputeDetail':
              return <DisputeDetailPage dispute={activeDispute} onBack={() => { setActiveDispute(null); setActiveView('disputes'); }} onEdit={handleOpenDisputeModal} />;
          case 'list':
          default:
              return <ProjectList projects={projects} changeRequests={changeRequests} onView={handleViewProject} onDelete={handleDeleteProject} onNewProject={() => setIsModalOpen(true)} />;
      }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
        <Header onNavigate={setActiveView} activeView={activeView} />
        <main className="flex-grow w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderContent()}
        </main>
        <Footer />
        <NewProjectModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onCreate={handleNewProject}
        />
        <NewChangeRequestModal
            isOpen={isNewChangeModalOpen}
            projects={projects}
            existingRequest={editingChangeRequest}
            onClose={() => {
              setIsNewChangeModalOpen(false);
              setEditingChangeRequest(null);
            }}
            onSave={handleSaveChangeRequest}
        />
        <DisputeModal
            isOpen={isDisputeModalOpen}
            existingDispute={editingDispute}
            onClose={() => { setIsDisputeModalOpen(false); setEditingDispute(null); }}
            onSave={handleSaveDispute}
        />
    </div>
  );
};

export default App;