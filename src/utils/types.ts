export interface CalculatorInputs {
  projectName?: string; // Nom du projet est maintenant optionnel ici, il vit au niveau supérieur
  centraleTotal: number;
  oAndMAnnuel: number;
  productionAnnuelMWh: number;
  plantLifetimeYears: number;
  selfConsumptionRate: number;
  gridPriceMWh: number;
  capPercentage: number;
  administrativeFeesPercentage: number;
  
  // Nouveaux champs pour le mode SEED et le sélecteur de mode
  calculationMode?: 'pv' | 'seed';
  montantMarche?: number;
  tauxPenaliteJournalier?: number;
  plafondPenalitesPourcentage?: number;
  nombreJoursRetard?: number;
}

export interface FullCalculationResults {
  // Résultats PV
  totalImpactJournalier: number;
  plafondValeur: number;
  plafondJours: number;
  centraleAnnuel: number;
  centraleJournalier: number;
  oAndMAnnuel: number;
  oAndMJournalier: number;
  autoconsommationAnnuel: number;
  autoconsommationJournalier: number;
  tco: number;
  coutSoutirageReseau: number;
  coutSoutirageCentrale: number;
  impactFinancierJournalier: number;
  fraisAdministratifs: number;

  // Résultats SEED
  penaliteJournaliereSeed?: number;
  plafondMontantSeed?: number;
  penaliteTotaleSeed?: number;
  penaliteFinaleSeed?: number;
}

export interface ContractDeadline {
  id: string;
  description: string;
  date: string; // Format YYYY-MM-DD
  noticePeriodInMonths: number;
  type: 'Échéance' | 'Jalon de Paiement';
  amount: number | null;
}

export type ProjectStatus = 'O5' | 'O6' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';

export interface SavedProject {
    id: string;
    projectName: string; 
    projectCode: string;
    projectAddress: string;
    projectType: 'EPC' | 'IPP Autoconsommation' | 'AMO' | 'EPC CVC' | 'Audit' | 'EMS-Froid' | 'PV Injection' | 'Prestation Intellectuelle AO Public' | 'Travaux AO Public'; 
    status: ProjectStatus;
    projectUrl?: string; // AJOUTER CETTE LIGNE
    baseTermsheet: string; 
    baseTermsheetName: string;
    inputs: CalculatorInputs;
    results: FullCalculationResults;
    risks: RiskItem[];
    deadlines: ContractDeadline[];
    savedAt: string;
}

export interface MitigationAction {
  id: string;
  description: string;
  dueDate: string | null; // Format YYYY-MM-DD
  status: 'À Faire' | 'Terminé';
}

export interface RiskItem {
  uid: string; // Unique ID for React key
  id: string;
  projet: string;
  risque: string;
  typeRisque: string;
  description: string;
  coutProbableMaximal: number | null;
  probabiliteAvant: number | null;
  explicationCalcul: string;
  mitigationActions: MitigationAction[];
  coutMitigation: number | null;
  probabiliteApres: number | null;
}

export interface Amendment {
  id: string;
  description: string;
  signatureDate: string; // Format YYYY-MM-DD
}

export interface ChangeRequest {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: 'Demandé' | 'En Analyse' | 'Approuvé' | 'Rejeté' | 'Implémenté';
  impact?: string;
  createdAt: string;
  requester: string;

  // Nouveaux champs
  changeNumber: string;
  projectCode: string;
  contractRef: string;
  requesterName: string;
  requesterContact: string;
  priority: 'Faible' | 'Moyenne' | 'Élevée';
  elementToModify: string;
  description: string;
  expectedTimeline: string;
  estimatedCost: number | null;
  hasPurchasingImpact?: boolean;
  amendments?: Amendment[];
}

export interface PurchasingAction {
  id: string;
  changeRequestId: string;
  changeRequestTitle: string;
  projectId: string;
  projectName: string;
  actionDescription: string;
  status: 'À faire' | 'Terminé';
  createdAt: string;
}
export interface Dispute {
  id: string;
  title: string;
  relatedContract: string; // Nom du contrat concerné
  status: 'Ouvert' | 'En analyse' | 'Négociation' | 'Résolu' | 'Clos' | 'En cours';
  amount: number | null; // Montant en jeu (legacy, keeping for compatibility)
  manager: string; // Responsable du dossier
  startDate: string; // Date de création du dossier/litige
  problemSummary: string; // Legacy field
  desiredOutcome: string; // Legacy field

  // Nouveaux champs inspirés de l'image "Détails Sinistre"
  description?: string;
  spv?: string;
  address?: string;
  incidentDate?: string; // Date sinistre, format YYYY-MM-DD
  
  // Section Finances
  quoteAmount?: number | null; // Montant Devis
  deductible?: number | null; // Franchise
  reimbursement?: number | null; // Remboursement

  // Section Expertise & Suivi
  expert?: string;
  expertiseDate?: string; // Format YYYY-MM-DD
  lastFollowUpDate?: string; // Date dernier suivi, format YYYY-MM-DD
  nextFollowUpDate?: string; // Prochain Suivi, format YYYY-MM-DD
  insurerRef?: string; // Réf. Assureur
  sharepointLink?: string; // Lien SharePoint
  
  // Section Détails du Suivi
  followUpDetails?: string;
}