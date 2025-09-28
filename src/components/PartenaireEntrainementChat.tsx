
import React, { useState, useEffect, useRef } from 'react';

type ChatMessage = {
    role: 'user' | 'model';
    parts: string;
};

interface PartenaireEntrainementChatProps {
    chatHistory: ChatMessage[];
    onSendMessage: (question: string) => void;
    isLoading: boolean;
}

const AiIcon = () => (
    <img 
        src="https://media.licdn.com/dms/image/v2/D4E03AQGnhQl3OhIeVQ/profile-displayphoto-crop_800_800/B4EZgD27j3HEAI-/0/1752411389383?e=1759363200&v=beta&t=a34YD0UcAovY66vhd4cpq3GYn4WtPhcXr6sKwmspmmc"
        alt="WWCD (What would Christophe Do?) IA"
        className="flex-shrink-0 w-7 h-7 rounded-full object-cover"
    />
);

const PartenaireEntrainementChat: React.FC<PartenaireEntrainementChatProps> = ({ chatHistory, onSendMessage, isLoading }) => {
    const [currentQuestion, setCurrentQuestion] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to the bottom of the chat history when new messages are added
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory, isLoading]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (currentQuestion.trim() && !isLoading) {
            onSendMessage(currentQuestion);
            setCurrentQuestion('');
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-200">
            <h6 className="text-sm font-semibold text-gray-700 mb-2">WWCD (What would Christophe Do?)</h6>
            <div ref={chatContainerRef} className="space-y-3 h-48 overflow-y-auto bg-gray-50 p-3 rounded-md mb-3 border">
                {chatHistory.length === 0 && !isLoading ? (
                    <div className="flex items-center justify-center h-full text-center text-gray-500 text-sm">
                        <p>Posez une question pour démarrer la conversation avec l'IA.</p>
                    </div>
                ) : (
                    <>
                        {chatHistory.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 {msg.role === 'model' && (
                                    <AiIcon />
                                )}
                                <div className={`max-w-[80%] px-3 py-2 rounded-lg shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-secondary text-white rounded-br-none' 
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                }`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.parts}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                             <div className="flex items-end gap-2 justify-start">
                                <AiIcon />
                                <div className="max-w-[80%] px-3 py-2 rounded-lg shadow-sm bg-white border border-gray-200 text-gray-800 rounded-bl-none">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder={isLoading ? "L'IA est en train de répondre..." : "Posez une question sur cet écart..."}
                    className="flex-grow w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:ring-1 focus:ring-secondary focus:border-secondary transition disabled:bg-gray-100"
                    aria-label="Poser une question"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="flex-shrink-0 px-4 py-2 text-sm font-medium text-white bg-secondary border border-transparent rounded-md shadow-sm hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
                    disabled={!currentQuestion.trim() || isLoading}
                >
                    Envoyer
                </button>
            </form>
        </div>
    );
};

export default PartenaireEntrainementChat;