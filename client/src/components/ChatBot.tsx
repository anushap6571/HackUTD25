import { useState, useRef, useEffect } from 'react';
import { Send, ChevronUp, ChevronDown } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  matchedCars?: Car[];
}

interface Car {
  model: string;
  year: number;
  price: number;
  mileage?: number;
  image_url?: string;
  body_type?: string;
  maker?: string;
}

interface ChatBotProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const ChatBot = ({ isExpanded, onToggle }: ChatBotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your Toyota assistant. Tell me about your ideal car - budget, lifestyle, needs - and I\'ll help you find the perfect match!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isExpanded]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const endpoint = `${API_URL}/api/chat-recommendations`;
      console.log('🔔 Sending request to:', endpoint);
      console.log('   Message:', messageText);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch (e) {
          errorText = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorText);
      }

      const data = await response.json();
      console.log('✅ Received response:', data);

      if (data.success) {
        // Only add message if there's content or matched cars
        if (data.response || (data.matched_cars && data.matched_cars.length > 0)) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response || '',  // Empty string if no text
            timestamp: new Date(),
            matchedCars: data.matched_cars || []
          };

          setMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        throw new Error(data.error || 'Failed to get recommendation');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMessage = 'Sorry, I encountered an error. ';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage += 'Could not connect to the backend server. Please make sure the server is running on http://127.0.0.1:5000';
      } else if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim());
    }
  };

  return (
    <div className="w-full">
      {/* Collapsed State - Input Bar */}
      {!isExpanded && (
        <div 
          onClick={onToggle}
          className="w-full bg-container-primary border border-container-stroke rounded-lg px-4 py-3 cursor-pointer hover:bg-container-secondary transition-colors duration-200 flex items-center justify-between shadow-sm"
        >
          <input
            type="text"
            placeholder="Ask about cars, financing, or get recommendations..."
            className="flex-1 bg-transparent border-none outline-none text-text-dark placeholder-text-secondary text-sm"
            readOnly
          />
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        </div>
      )}

      {/* Expanded State - Full Chat Interface */}
      {isExpanded && (
        <div className="w-full bg-white border border-container-stroke rounded-lg shadow-lg flex flex-col" style={{ height: '600px' }}>
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-4 flex justify-between items-center rounded-t-lg">
            <div>
              <h2 className="text-lg font-semibold">Toyota Car Assistant</h2>
              <p className="text-xs opacity-90">Find your perfect Toyota</p>
            </div>
            <button
              onClick={onToggle}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="Close chat"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container - Only visible when expanded */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-5 space-y-3 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl shadow-sm text-sm ${
                    message.role === 'user'
                      ? 'bg-red-600 text-white rounded-tr-sm ml-auto px-4 py-3'
                      : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200 mr-auto leading-relaxed px-4 py-3'
                  }`}
                >
                  {message.content && (
                    <p className="whitespace-pre-wrap mb-3">{message.content}</p>
                  )}
                  
                  {/* Display matched cars if any */}
                  {message.role === 'assistant' && message.matchedCars && message.matchedCars.length > 0 && (
                    <div className="space-y-2">
                      {message.matchedCars.slice(0, 3).map((car, index) => (
                        <div
                          key={index}
                          className="bg-gray-100 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-150 cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            {car.image_url && (
                              <img
                                src={car.image_url}
                                alt={car.model}
                                className="w-12 h-12 object-cover rounded flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-[15px] text-gray-900 truncate">
                                {car.model} {car.year}
                              </h4>
                              <p className="text-xs text-gray-600 mt-1">
                                ${car.price?.toLocaleString() || 'N/A'}
                              </p>
                              {car.mileage && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {car.mileage.toLocaleString()} miles
                                </p>
                              )}
                              {car.body_type && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                                  {car.body_type}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-sm border border-gray-200 px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Describe your ideal car..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

