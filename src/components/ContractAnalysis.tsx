import React, { useState } from 'react';
// import { GoogleGenAI } from '@google/genai';

// ✅ Configuration API pour AI Studio
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ContractAnalysis: React.FC = () => {
    const [textA, setTextA] = useState('');
    const [textB, setTextB] = useState('');
    const [analysisResult, setAnalysisResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = async () => {
        if (!textA || !textB) {
            alert('Veuillez remplir les deux champs de texte.');
            return;
        }
        
        setIsLoading(true);
        setAnalysisResult('');
        setError("Analyse IA temporairement indisponible. La fonctionnalité est en cours de maintenance.");
        setIsLoading(false);
    };

    // ✅ VERSION SIMPLIFIÉE SANS TAILWIND
    return (
        <div style={{ 
            backgroundColor: 'white', 
            padding: '2rem', 
            borderRadius: '8px', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <div style={{ 
                borderBottom: '1px solid #ddd', 
                paddingBottom: '1rem', 
                marginBottom: '2rem' 
            }}>
                <h2 style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: 'bold', 
                    color: '#333',
                    margin: '0 0 0.5rem 0'
                }}>
                    Analyse Comparative de Contrats
                </h2>
                <p style={{ 
                    fontSize: '0.9rem', 
                    color: '#666', 
                    margin: '0' 
                }}>
                    Collez votre texte initial (ex: termsheet) et le texte modifié pour identifier les changements et les risques potentiels.
                </p>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                gap: '1.5rem', 
                marginBottom: '2rem' 
            }}>
                <div>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '0.9rem', 
                        fontWeight: '600', 
                        color: '#333', 
                        marginBottom: '0.5rem' 
                    }}>
                        Texte de Base (Document A)
                    </label>
                    <textarea
                        rows={18}
                        value={textA}
                        onChange={(e) => setTextA(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            border: '1px solid #ccc', 
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box'
                        }}
                        placeholder="Collez le texte du document A ici..."
                    />
                </div>
                <div>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '0.9rem', 
                        fontWeight: '600', 
                        color: '#333', 
                        marginBottom: '0.5rem' 
                    }}>
                        Texte à Comparer (Document B)
                    </label>
                    <textarea
                        rows={18}
                        value={textB}
                        onChange={(e) => setTextB(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            border: '1px solid #ccc', 
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box'
                        }}
                        placeholder="Collez le texte du document B ici..."
                    />
                </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <button
                    onClick={handleAnalysis}
                    disabled={isLoading}
                    style={{ 
                        padding: '0.75rem 2rem', 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        color: 'white', 
                        backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
                        border: 'none', 
                        borderRadius: '6px',
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isLoading ? 'Analyse en cours...' : 'Analyser les différences'}
                </button>
            </div>

            {/* ✅ Affichage d'erreur simplifié */}
            {error && (
                <div style={{ 
                    marginTop: '2rem', 
                    paddingTop: '1.5rem', 
                    borderTop: '1px solid #ddd' 
                }}>
                    <h3 style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: '600', 
                        color: '#dc2626', 
                        marginBottom: '1rem' 
                    }}>
                        Erreur
                    </h3>
                    <div style={{ 
                        padding: '1rem', 
                        backgroundColor: '#fef2f2', 
                        borderRadius: '6px', 
                        border: '1px solid #fecaca' 
                    }}>
                        <p style={{ color: '#991b1b', margin: '0' }}>{error}</p>
                    </div>
                </div>
            )}

            {/* ✅ Affichage des résultats SANS ReactMarkdown pour tester */}
            {analysisResult && !error && !isLoading && (
                <div style={{ 
                    marginTop: '2rem', 
                    paddingTop: '1.5rem', 
                    borderTop: '1px solid #ddd' 
                }}>
                    <h3 style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: '600', 
                        color: '#333', 
                        marginBottom: '1rem' 
                    }}>
                        Résultat de l'analyse
                    </h3>
                    <div style={{ 
                        padding: '1.5rem', 
                        backgroundColor: '#f9fafb', 
                        borderRadius: '6px', 
                        border: '1px solid #e5e7eb',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'system-ui, sans-serif',
                        lineHeight: '1.6'
                    }}>
                        {analysisResult}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractAnalysis;