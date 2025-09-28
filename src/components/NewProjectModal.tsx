
import React, { useState } from 'react';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, code: string, address: string, type: 'EPC' | 'IPP Autoconsommation' | 'AMO' | 'EPC CVC' | 'Audit' | 'EMS-Froid' | 'PV Injection' | 'Prestation Intellectuelle AO Public' | 'Travaux AO Public') => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [address, setAddress] = useState('');
    const [type, setType] = useState<'EPC' | 'IPP Autoconsommation' | 'AMO' | 'EPC CVC' | 'Audit' | 'EMS-Froid' | 'PV Injection' | 'Prestation Intellectuelle AO Public' | 'Travaux AO Public'>('EPC');

    const handleSubmit = () => {
        if (name.trim()) {
            onCreate(name, code, address, type);
        } else {
            alert('Veuillez donner un nom au projet.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-xl font-semibold text-primary mb-4">Nouveau Projet</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">Nom du projet</label>
                        <input
                            type="text"
                            id="project-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                            placeholder="Ex: Projet Solaire Alpha"
                        />
                    </div>
                    <div>
                        <label htmlFor="project-code" className="block text-sm font-medium text-gray-700 mb-1">Code Projet</label>
                        <input
                            type="text"
                            id="project-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                            placeholder="Ex: P2024-001"
                        />
                    </div>
                    <div>
                        <label htmlFor="project-address" className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                        <input
                            type="text"
                            id="project-address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                            placeholder="Ex: 123 Rue de l'Énergie, 75000 Paris"
                        />
                    </div>
                    <div>
                        <label htmlFor="project-type" className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
                        <select
                            id="project-type"
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                        >
                            <optgroup label="Projets PV">
                                <option value="EPC">PV - EPC</option>
                                <option value="IPP Autoconsommation">PV - IPP Autoconsommation</option>
                                <option value="PV Injection">PV - Injection Réseau</option>
                            </optgroup>
                            <optgroup label="Services Énergétiques">
                                <option value="EPC CVC">Services - EPC CVC</option>
                                <option value="AMO">Services - AMO</option>
                                <option value="EMS-Froid">Services - EMS-Froid</option>
                                <option value="Audit">Services - Audit (CGV)</option>
                                <option value="Prestation Intellectuelle AO Public">Services - Prestation Intellectuelle AO Public</option>
                                <option value="Travaux AO Public">Services - Travaux AO Public</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end items-center mt-6 pt-4 border-t space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">Annuler</button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md shadow-sm hover:bg-opacity-90">Créer le projet</button>
                </div>
            </div>
        </div>
    );
};

export default NewProjectModal;