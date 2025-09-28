
import React, { useState } from 'react';
import { formatDate } from '../utils/formatters';

interface Template {
  id: number;
  name: string;
  category: string;
  content: string;
  date: string;
}
interface ParametresProps {
  templates: Template[];
}

const Parametres: React.FC<ParametresProps> = ({ templates }) => {
    const [activeTab, setActiveTab] = useState<'PV' | 'SEED' | 'Achats'>('PV');

    const filteredTemplates = templates.filter(t => t.category === activeTab);

    return (
        <div className="bg-white rounded-lg shadow-md p-6 lg:p-8">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-primary">Paramètres des Modèles de Contrat</h2>
            </div>
            
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-4">
                <button onClick={() => setActiveTab('PV')} className={`py-2 px-4 text-sm font-semibold transition-colors duration-200 ${activeTab === 'PV' ? 'border-b-2 border-secondary text-primary' : 'text-gray-500 hover:text-primary'}`}>
                    Projets PV
                </button>
                <button onClick={() => setActiveTab('SEED')} className={`py-2 px-4 text-sm font-semibold transition-colors duration-200 ${activeTab === 'SEED' ? 'border-b-2 border-secondary text-primary' : 'text-gray-500 hover:text-primary'}`}>
                    Projets SEED
                </button>
                <button onClick={() => setActiveTab('Achats')} className={`py-2 px-4 text-sm font-semibold transition-colors duration-200 ${activeTab === 'Achats' ? 'border-b-2 border-secondary text-primary' : 'text-gray-500 hover:text-primary'}`}>
                    Achats (CGA/CGV)
                </button>
                </nav>
            </div>
            <div>
                <ul className="space-y-3">
                {filteredTemplates.map(template => (
                    <li key={template.id} className="p-3 bg-gray-50 rounded-md border flex justify-between items-center hover:bg-gray-100 transition-colors">
                    <div>
                        <p className="font-semibold text-primary">{template.name}</p>
                        <p className="text-xs text-gray-500">Date du modèle : {formatDate(template.date)}</p>
                    </div>
                    <div className="space-x-3">
                        <button className="font-semibold text-secondary hover:underline text-sm">Voir/Modifier</button>
                        <button className="font-semibold text-red-600 hover:underline text-sm">Supprimer</button>
                    </div>
                    </li>
                ))}
                </ul>
                {filteredTemplates.length === 0 && (
                    <div className="text-center text-gray-500 py-16">
                        <h3 className="text-lg font-semibold">Aucun modèle dans cette catégorie</h3>
                        <p className="mt-1">Cette catégorie de contrat n'a pas encore de modèle de référence.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Parametres;
