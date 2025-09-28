
import React from 'react';

// Données de la matrice de gouvernance - nous pourrons les rendre dynamiques plus tard
const governanceData = [
    { phase: 'Appel d\'offres', task: 'Validation GO/NOGO', r: 'Directeur de filiale', a: 'Directeur de filiale', c: 'Directeur Technique, Directeur Juridique', i: 'Directeur Construction' },
    { phase: 'Appel d\'offres', task: 'Validation offre financière et technique', r: 'Directeur de filiale', a: 'Directeur de filiale', c: 'Directeur Juridique', i: 'Directeur Construction' },
    { phase: 'Contrat', task: 'Validation juridique', r: 'Directeur Juridique', a: 'Directeur Juridique', c: 'Directeur de filiale', i: 'Chef de Projet' },
    { phase: 'Contrat', task: 'Signature contrat', r: 'Directeur de filiale', a: 'Directeur de filiale', c: 'Directeur Juridique', i: 'Chef de Projet' },
    { phase: 'Avenant', task: 'Validation juridique', r: 'Directeur Juridique', a: 'Directeur Juridique', c: 'Directeur de filiale', i: 'Chef de Projet' },
    { phase: 'Avenant', task: 'Signature avenant', r: 'Directeur de filiale', a: 'Directeur de filiale', c: 'Directeur Juridique', i: 'Chef de Projet' },
];

const GovernanceMatrix: React.FC = () => {
    const phases = [...new Set(governanceData.map(item => item.phase))];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-primary mb-4">Matrice de Gouvernance (RACI)</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-100 text-xs text-primary font-semibold uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-1/3">Tâche</th>
                            <th scope="col" className="px-4 py-3 text-center">R (Réalisateur)</th>
                            <th scope="col" className="px-4 py-3 text-center">A (Approbateur)</th>
                            <th scope="col" className="px-4 py-3 text-center">C (Consulté)</th>
                            <th scope="col" className="px-4 py-3 text-center">I (Informé)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {phases.map(phase => (
                            <React.Fragment key={phase}>
                                <tr>
                                    <td colSpan={5} className="px-6 py-2 bg-gray-50 font-bold text-primary border-t border-b">
                                        {phase}
                                    </td>
                                </tr>
                                {governanceData.filter(item => item.phase === phase).map((item, index) => (
                                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{item.task}</td>
                                        <td className="px-4 py-4">{item.r}</td>
                                        <td className="px-4 py-4">{item.a}</td>
                                        <td className="px-4 py-4">{item.c}</td>
                                        <td className="px-4 py-4">{item.i}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                <div className="mt-4 p-4 bg-gray-50 rounded-md text-xs text-gray-700">
                    <p><span className="font-bold">R (Réalisateur):</span> La personne qui exécute la tâche.</p>
                    <p><span className="font-bold">A (Approbateur):</span> La personne qui est ultimement responsable de l'achèvement correct de la tâche.</p>
                    <p><span className="font-bold">C (Consulté):</span> Les personnes dont l'avis est sollicité, généralement des experts.</p>
                    <p><span className="font-bold">I (Informé):</span> Les personnes tenues informées de l'avancement et de l'achèvement.</p>
                </div>
            </div>
        </div>
    );
};

export default GovernanceMatrix;