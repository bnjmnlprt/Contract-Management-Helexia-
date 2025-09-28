

import React, { useState, useEffect } from 'react';
import type { Dispute } from '../utils/types';

interface DisputeModalProps {
  isOpen: boolean;
  existingDispute: Dispute | null;
  onClose: () => void;
  onSave: (data: Partial<Dispute>) => void;
}

const NewDisputeModal: React.FC<DisputeModalProps> = ({ isOpen, existingDispute, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Dispute>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(existingDispute || {
        title: '',
        relatedContract: '',
        amount: null,
        manager: '',
        problemSummary: '',
        desiredOutcome: ''
      });
    }
  }, [isOpen, existingDispute]);

  const handleChange = (field: keyof Omit<Dispute, 'id' | 'startDate'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAmountChange = (value: string) => {
    setFormData(prev => ({ ...prev, amount: value ? parseFloat(value) : null }));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.relatedContract || !formData.manager) {
      alert('Veuillez remplir au moins le titre, le contrat concerné et le responsable.');
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold text-primary">{existingDispute ? 'Modifier le litige' : 'Nouveau litige'}</h3>
           <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre du litige</label>
            <input type="text" value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} placeholder="Titre du litige" className="w-full p-2 border border-gray-300 rounded-md bg-white" />
          </div>
          {existingDispute && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select value={formData.status || ''} onChange={e => handleChange('status', e.target.value as any)} className="w-full p-2 border border-gray-300 rounded-md bg-white">
                <option>Ouvert</option>
                <option>En analyse</option>
                <option>Négociation</option>
                <option>Résolu</option>
                <option>Clos</option>
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contrat concerné</label>
                  <input type="text" value={formData.relatedContract || ''} onChange={(e) => handleChange('relatedContract', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white" placeholder="Ex: Projet Solaire Alpha" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                  <input type="text" value={formData.manager || ''} onChange={(e) => handleChange('manager', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white" placeholder="Ex: Alice Dupont" />
              </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant en jeu (€)</label>
            <input type="number" value={formData.amount === null || formData.amount === undefined ? '' : formData.amount} onChange={(e) => handleAmountChange(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Résumé du problème</label>
            <textarea rows={4} value={formData.problemSummary || ''} onChange={(e) => handleChange('problemSummary', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Résultat souhaité</label>
            <textarea rows={3} value={formData.desiredOutcome || ''} onChange={(e) => handleChange('desiredOutcome', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white"></textarea>
          </div>
        </div>
        <div className="flex justify-end items-center mt-6 pt-4 border-t space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Annuler</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md shadow-sm hover:bg-opacity-90">{existingDispute ? 'Sauvegarder' : 'Créer'}</button>
        </div>
      </div>
    </div>
  );
};

export default NewDisputeModal;