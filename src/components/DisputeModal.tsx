

import React, { useState, useEffect } from 'react';
import type { Dispute } from '../utils/types';

interface DisputeModalProps {
  isOpen: boolean;
  existingDispute: Dispute | null;
  onClose: () => void;
  onSave: (data: Partial<Dispute>) => void;
}

const DisputeModal: React.FC<DisputeModalProps> = ({ isOpen, existingDispute, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Dispute>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(existingDispute || { 
        status: 'Ouvert',
        title: '',
        relatedContract: '',
        amount: null,
        manager: '',
        problemSummary: '',
        desiredOutcome: '',
        description: '',
        spv: '',
        address: '',
        incidentDate: '',
        quoteAmount: null,
        deductible: null,
        reimbursement: null,
        expert: '',
        expertiseDate: '',
        lastFollowUpDate: '',
        nextFollowUpDate: '',
        insurerRef: '',
        sharepointLink: '',
        followUpDetails: '',
      });
    }
  }, [isOpen, existingDispute]);

  const handleChange = (field: keyof Dispute, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleNumericChange = (field: 'amount' | 'quoteAmount' | 'deductible' | 'reimbursement', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value ? parseFloat(value) : null }));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.relatedContract || !formData.manager) {
      alert('Veuillez remplir au moins le projet, le contrat et le responsable.');
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl">
        <h3 className="text-xl font-semibold text-primary mb-4 border-b pb-3">{existingDispute ? 'Modifier le dossier' : 'Nouveau dossier'}</h3>
        
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-4 -mr-4">
            {/* Section 1: Informations Générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-600">Projet</label><input type="text" value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} placeholder="Nom du projet" className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
                <div><label className="block text-sm font-medium text-gray-600">Contrat Concerné</label><input type="text" value={formData.relatedContract || ''} onChange={e => handleChange('relatedContract', e.target.value)} placeholder="Contrat affecté" className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
                <div><label className="block text-sm font-medium text-gray-600">SPV</label><input type="text" value={formData.spv || ''} onChange={e => handleChange('spv', e.target.value)} placeholder="SPV" className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
                <div><label className="block text-sm font-medium text-gray-600">Adresse</label><input type="text" value={formData.address || ''} onChange={e => handleChange('address', e.target.value)} placeholder="Adresse du site" className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
                <div><label className="block text-sm font-medium text-gray-600">Date de la cause du litige</label><input type="date" value={formData.incidentDate || ''} onChange={e => handleChange('incidentDate', e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
                <div><label className="block text-sm font-medium text-gray-600">Statut</label><select value={formData.status || 'Ouvert'} onChange={e => handleChange('status', e.target.value as any)} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white"><option>Ouvert</option><option>En analyse</option><option>En cours</option><option>Négociation</option><option>Résolu</option><option>Clos</option></select></div>
                <div><label className="block text-sm font-medium text-gray-600">Responsable</label><input type="text" value={formData.manager || ''} onChange={e => handleChange('manager', e.target.value)} placeholder="Responsable du dossier" className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
            </div>
            
            {/* Section 2: Description */}
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-2 border-b pb-1">Description</h4>
              <textarea value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Description détaillée..." className="w-full p-2 border border-gray-300 rounded-md bg-white"></textarea>
            </div>

            {/* Section 3: Finances */}
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-2 border-b pb-1">Finances</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-600">Montant évaluation du dommage (€)</label><input type="number" value={formData.quoteAmount || ''} onChange={e => handleNumericChange('quoteAmount', e.target.value)} placeholder="0.00" className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
                  <div><label className="block text-sm font-medium text-gray-600">Remboursement (€)</label><input type="number" value={formData.reimbursement || ''} onChange={e => handleNumericChange('reimbursement', e.target.value)} placeholder="0.00" className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
              </div>
            </div>

            {/* Section 4: Expertise & Suivi */}
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-2 border-b pb-1">Expertise & Suivi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-600">Conseil</label><input type="text" value={formData.expert || ''} onChange={e => handleChange('expert', e.target.value)} placeholder="Nom du conseil" className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
                  <div><label className="block text-sm font-medium text-gray-600">Date Prochaine étape</label><input type="date" value={formData.expertiseDate || ''} onChange={e => handleChange('expertiseDate', e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
                  <div><label className="block text-sm font-medium text-gray-600">Date Dernier Suivi</label><input type="date" value={formData.lastFollowUpDate || ''} onChange={e => handleChange('lastFollowUpDate', e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
                  <div><label className="block text-sm font-medium text-gray-600">Prochain Suivi</label><input type="date" value={formData.nextFollowUpDate || ''} onChange={e => handleChange('nextFollowUpDate', e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
                  <div><label className="block text-sm font-medium text-gray-600">No. dossier Conseil</label><input type="text" value={formData.insurerRef || ''} onChange={e => handleChange('insurerRef', e.target.value)} placeholder="Référence dossier conseil" className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
                  <div><label className="block text-sm font-medium text-gray-600">Lien SharePoint</label><input type="text" value={formData.sharepointLink || ''} onChange={e => handleChange('sharepointLink', e.target.value)} placeholder="URL SharePoint" className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white" /></div>
              </div>
            </div>

            {/* Section 5: Détails du Suivi */}
            <div>
                <h4 className="text-lg font-medium text-gray-700 mb-2 border-b pb-1">Détails du Suivi</h4>
                <textarea value={formData.followUpDetails || ''} onChange={e => handleChange('followUpDetails', e.target.value)} rows={3} placeholder="Détails du suivi..." className="w-full p-2 border border-gray-300 rounded-md bg-white"></textarea>
            </div>
            
             {/* Section 6: Détails Litige (Legacy) */}
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-2 border-b pb-1">Détails spécifiques au Litige</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-600">Résumé du problème (Litige)</label><textarea value={formData.problemSummary || ''} onChange={e => handleChange('problemSummary', e.target.value)} rows={3} placeholder="Résumé du problème..." className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white"></textarea></div>
                <div><label className="block text-sm font-medium text-gray-600">Résultat souhaité (Litige)</label><textarea value={formData.desiredOutcome || ''} onChange={e => handleChange('desiredOutcome', e.target.value)} rows={3} placeholder="Résultat souhaité..." className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white"></textarea></div>
              </div>
            </div>
        </div>
        <div className="flex justify-end items-center mt-6 pt-4 border-t space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-200 rounded-md">Annuler</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm text-white bg-secondary rounded-md">{existingDispute ? 'Sauvegarder les modifications' : 'Créer le dossier'}</button>
        </div>
      </div>
    </div>
  );
};

export default DisputeModal;