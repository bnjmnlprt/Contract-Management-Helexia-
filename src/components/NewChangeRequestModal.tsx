
import React, { useState, useEffect } from 'react';
import type { SavedProject, ChangeRequest, Amendment } from '../utils/types';
import { formatDate } from '../utils/formatters';

interface ChangeRequestModalProps {
  isOpen: boolean;
  projects: SavedProject[];
  existingRequest: ChangeRequest | null; // Peut être null (création) ou un objet (modification)
  onClose: () => void;
  onSave: (data: Partial<ChangeRequest>) => void;
}

const NewChangeRequestModal: React.FC<ChangeRequestModalProps> = ({ isOpen, projects, existingRequest, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<ChangeRequest>>({});
  const [amendmentDesc, setAmendmentDesc] = useState('');
  const [amendmentDate, setAmendmentDate] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (existingRequest) {
          setFormData(existingRequest);
        } else {
          setFormData({
            projectId: projects.length > 0 ? projects[0].id : '',
            status: 'Demandé',
            priority: 'Moyenne',
            requesterName: '',
            requesterContact: '',
            elementToModify: '',
            description: '',
            expectedTimeline: '',
            estimatedCost: null,
            title: '',
            hasPurchasingImpact: false,
          });
        }
    }
  }, [isOpen, existingRequest, projects]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        const { value } = e.target;
        let finalValue: string | number | null = value;
        if (type === 'number' && name === 'estimatedCost') {
          finalValue = value ? parseFloat(value) : null;
        }
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.projectId) {
      alert("Veuillez renseigner le titre et sélectionner un projet.");
      return;
    }
    onSave(formData);
  };

  const handleAddAmendment = () => {
    if (!amendmentDesc || !amendmentDate) {
        alert("Veuillez fournir une description et une date pour l'avenant.");
        return;
    }
    const newAmendment: Amendment = {
        id: `amend-${Date.now()}`,
        description: amendmentDesc,
        signatureDate: amendmentDate,
    };
    setFormData(prev => ({
        ...prev,
        amendments: [...(prev.amendments || []), newAmendment]
    }));
    setAmendmentDesc('');
    setAmendmentDate('');
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 overflow-y-auto pt-10 pb-10">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl transform transition-all">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold text-primary">{existingRequest ? 'Modifier la Demande' : 'Nouvelle Demande de Changement'}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          {/* Project and Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">Projet</label>
              <select id="projectId" name="projectId" value={formData.projectId || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white">
                {projects.map(p => <option key={p.id} value={p.id}>{p.projectName}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre de la demande</label>
              <input type="text" id="title" name="title" value={formData.title || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white" />
            </div>
          </div>

          {/* Requester Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="requesterName" className="block text-sm font-medium text-gray-700">Nom du demandeur</label>
              <input type="text" id="requesterName" name="requesterName" value={formData.requesterName || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white" />
            </div>
            <div>
              <label htmlFor="requesterContact" className="block text-sm font-medium text-gray-700">Contact du demandeur</label>
              <input type="text" id="requesterContact" name="requesterContact" value={formData.requesterContact || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white" />
            </div>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priorité</label>
              <select id="priority" name="priority" value={formData.priority || 'Moyenne'} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white">
                <option>Faible</option>
                <option>Moyenne</option>
                <option>Élevée</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
              <select id="status" name="status" value={formData.status || 'Demandé'} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white">
                <option>Demandé</option>
                <option>En Analyse</option>
                <option>Approuvé</option>
                <option>Rejeté</option>
                <option>Implémenté</option>
              </select>
            </div>
          </div>

          {/* Change Details */}
          <div>
            <label htmlFor="elementToModify" className="block text-sm font-medium text-gray-700">Élément à modifier</label>
            <input type="text" id="elementToModify" name="elementToModify" value={formData.elementToModify || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description détaillée du changement</label>
            <textarea id="description" name="description" rows={4} value={formData.description || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white" />
          </div>
          
          <div className="flex items-center">
            <input 
                type="checkbox" 
                id="purchasing-impact" 
                name="hasPurchasingImpact"
                checked={!!formData.hasPurchasingImpact} 
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
            />
            <label htmlFor="purchasing-impact" className="ml-2 block text-sm text-gray-900">
                Ce changement a un impact sur les Achats (créera une action dans le module Achats si approuvé)
            </label>
          </div>
          
          {/* Impacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expectedTimeline" className="block text-sm font-medium text-gray-700">Impact sur le calendrier</label>
              <input type="text" id="expectedTimeline" name="expectedTimeline" value={formData.expectedTimeline || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white" />
            </div>
            <div>
              <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700">Impact sur les coûts (€)</label>
              <input type="number" id="estimatedCost" name="estimatedCost" value={formData.estimatedCost === null ? '' : String(formData.estimatedCost)} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white" />
            </div>
          </div>

          {/* Amendments */}
          {existingRequest && (
            <div className="pt-4 border-t">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Avenants Signés</h4>
                <ul className="space-y-2 mb-4">
                    {(formData.amendments || []).map(amend => (
                        <li key={amend.id} className="text-sm p-2 bg-gray-50 rounded-md border">
                           {amend.description} - Signé le {formatDate(amend.signatureDate)}
                        </li>
                    ))}
                </ul>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input type="text" value={amendmentDesc} onChange={e => setAmendmentDesc(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date de signature</label>
                        <input type="date" value={amendmentDate} onChange={e => setAmendmentDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white" />
                    </div>
                </div>
                <div className="text-right mt-2">
                    <button onClick={handleAddAmendment} className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">+ Ajouter un avenant</button>
                </div>
            </div>
          )}
        </div>

        <div className="flex justify-end items-center mt-6 pt-4 border-t space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Annuler</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md shadow-sm hover:bg-opacity-90">
            {existingRequest ? 'Enregistrer les modifications' : 'Créer la demande'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChangeRequestModal;
