// utils/geminiApi.ts - Gestion centralisée des appels Gemini
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using an inline type based on guideline examples as the actual type might not be exported
type GenerateContentParams = {
  model: string;
  contents: any; // Can be string or object with parts
  config?: any;
};

/**
 * Calls Gemini API's generateContent. This is now a real implementation.
 * @param request The request object for generateContent.
 * @returns A promise that resolves to a response object with text.
 */
export async function generateContentWithRetry(request: GenerateContentParams): Promise<{ text: string }> {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent(request);
        return {
            text: response.text,
        };
    } catch (error) {
        console.error("Erreur API Gemini:", error);
        let errorMessage = `Erreur API Gemini: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        if (error instanceof Error) {
            if (error.message?.includes('API_KEY')) {
                errorMessage = "Clé API invalide ou manquante. Vérifiez votre configuration.";
            } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
                errorMessage = "Quota API dépassé. Veuillez attendre quelques minutes et réessayer.";
            } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
                errorMessage = "Problème de connexion réseau. Vérifiez votre connexion internet.";
            }
        }
        // Re-throw a more structured error or just the message.
        throw new Error(errorMessage);
    }
}

/**
 * FIX: Implement the streaming function to call the actual Gemini API instead of returning a mocked response.
 * @param request The request object for generateContentStream.
 * @returns A promise that resolves to a mocked async iterable stream.
 */
export async function generateContentStreamWithRetry(request: GenerateContentParams): Promise<AsyncGenerator<GenerateContentResponse>> {
    try {
        const stream = await ai.models.generateContentStream(request);
        return stream;
    } catch (error) {
        console.error("Erreur API Gemini (stream):", error);
        let errorMessage = `Erreur API Gemini: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        if (error instanceof Error) {
            if (error.message?.includes('API_KEY')) {
                errorMessage = "Clé API invalide ou manquante. Vérifiez votre configuration.";
            } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
                errorMessage = "Quota API dépassé. Veuillez attendre quelques minutes et réessayer.";
            } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
                errorMessage = "Problème de connexion réseau. Vérifiez votre connexion internet.";
            }
        }
        throw new Error(errorMessage);
    }
}
