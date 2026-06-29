import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, X, Mic, MicOff } from 'lucide-react';
import axios from 'axios';
import './AIChatbot.css';

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hello! I'm your AI Healthcare Assistant. Describe your symptoms, or ask me to book an appointment.", isBot: true }
    ]);
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Setup Web Speech API
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + ' ' + transcript);
                setIsRecording(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, []);

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            recognitionRef.current?.start();
            setIsRecording(true);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const currentInput = input.trim();
        const newMessages = [...messages, { text: currentInput, isBot: false }];
        setMessages(newMessages);
        setInput('');

        try {
            const history = messages.map(m => ({ role: m.isBot ? 'model' : 'user', text: m.text }));
            const { data } = await axios.post('/api/ai/chat', { message: currentInput, history });
            setMessages(prev => [...prev, { text: data.reply, isBot: true }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting to my brain right now.", isBot: true }]);
        }
    };

    return (
        <div className={`chatbot-wrapper ${isOpen ? 'open' : ''}`}>
            {/* Chat Toggle Button */}
            {!isOpen && (
                <button className="chat-toggle btn-primary" onClick={() => setIsOpen(true)}>
                    <Bot size={24} />
                    <span>AI Assistant</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window glass">
                    <div className="chat-header">
                        <div className="flex items-center gap-2">
                            <Bot size={20} />
                            <strong>CareSync AI</strong>
                        </div>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="chat-body">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chat-bubble ${msg.isBot ? 'bot' : 'user'}`}>
                                <div className="avatar">
                                    {msg.isBot ? <Bot size={16} /> : <User size={16} />}
                                </div>
                                <div className="message-content">
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="chat-footer">
                        {recognitionRef.current && (
                            <button className={`mic-btn ${isRecording ? 'recording' : ''}`} onClick={toggleRecording} title="Voice Input">
                                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                        )}
                        <input
                            type="text"
                            placeholder="Type or speak your request..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button className="send-btn" onClick={handleSend} disabled={isRecording}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChatbot;
