import React, { useState, useEffect, useRef } from 'react';
import api from './api'; // same axios instance

const CoachChat = ({ setIsLoading }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(() => {
    // Initialize from localStorage, default to false if not found
    const savedState = localStorage.getItem("coach_chat_expanded");
    return savedState ? JSON.parse(savedState) : false;
  });
  const [isHidden, setIsHidden] = useState(() => {
    // Initialize from localStorage, default to false if not found
    const hiddenState = localStorage.getItem("coach_chat_hidden");
    return hiddenState ? JSON.parse(hiddenState) : false;
  });
  const [isThinking, setIsThinking] = useState(false); // New state for loading indicator
  
  const messagesEndRef = useRef(null);

  // Handle expand state change and save to localStorage
  const handleExpandToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem("coach_chat_expanded", JSON.stringify(newState));
  };

  // Handle hidden state change and save to localStorage
  const toggleHiddenMode = () => {
    const newHiddenState = !isHidden;
    setIsHidden(newHiddenState);
    localStorage.setItem("coach_chat_hidden", JSON.stringify(newHiddenState));
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  // Add welcome message when component mounts
  useEffect(() => {
    if (messages.length === 0 && !isHidden) {
      setMessages([{
        id: Date.now(),
        sender: 'coach',
        text: "Hi there! I'm your poker coach. Ask me any questions about the game, strategy, or your current hand."
      }]);
    }
  }, [messages.length, isHidden]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Auto-expand the chat when user sends a message
    if (!isExpanded) {
      setIsExpanded(true);
      localStorage.setItem("coach_chat_expanded", JSON.stringify(true));
    }
    
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputValue
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Dispatch loading start event and set local loading state
    window.dispatchEvent(new Event('coachLoadingStart'));
    if (setIsLoading) setIsLoading(true);
    setIsThinking(true); // Show the loading indicator
    
    setError(null);
    
    const localGameIdObj = JSON.parse(localStorage.getItem("game_id"));
    const gameId = localGameIdObj?.value || null;
    
    if (!gameId) {
      setError("Game session not found");
      if (setIsLoading) setIsLoading(false);
      setIsThinking(false); // Hide the loading indicator
      window.dispatchEvent(new Event('coachLoadingEnd'));
      return;
    }
    
    try {
      const response = await api.post("/games/coach-question", {
        game_id: gameId,
        question: userMessage.text
      });
      
      const coachResponse = {
        id: Date.now() + 1,
        sender: 'coach',
        text: response.data.advice
      };
      
      setMessages(prev => [...prev, coachResponse]);
    } catch (err) {
      console.error("Error getting coach response:", err);
      setError("Failed to get a response from the coach");
      
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'system',
        text: "Sorry, I couldn't process your question right now."
      }]);
    } finally {
      // Dispatch loading end event and set local loading state
      if (setIsLoading) setIsLoading(false);
      setIsThinking(false); // Hide the loading indicator
      window.dispatchEvent(new Event('coachLoadingEnd'));
    }
  };

  return (
    <div className={`bg-gray-800/80 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg border-l-4 border-blue-500 transition-all duration-300 flex flex-col w-96 ${isExpanded ? 'h-[600px]' : 'h-28'}`}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold flex items-center">
          <span className="mr-2 text-blue-400">❓</span>
          Ask Coach
        </h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleExpandToggle} 
            className="text-gray-400 hover:text-white transition-colors"
            title={isExpanded ? "Collapse chat" : "Expand chat"}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>
      
      {/* Chat messages container */}
      <div 
        className="flex-1 overflow-y-auto mb-3 space-y-3"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(59, 130, 246, 0.5) rgba(31, 41, 55, 0.3)'
        }}
      >
        <style jsx>{`
          /* For Webkit browsers (Chrome, Safari) */
          div::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          
          div::-webkit-scrollbar-track {
            background: rgba(31, 41, 55, 0.3);
            border-radius: 10px;
          }
          
          div::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.5);
            border-radius: 10px;
            transition: background 0.2s ease;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(59, 130, 246, 0.8);
          }
        `}</style>
        
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`px-3 py-2 rounded-lg max-w-[80%] ${
                message.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : message.sender === 'system'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-700 text-white'
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
        
        {/* Loading indicator - Now conditionally shown */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white px-3 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Ask a question..."
          className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!inputValue.trim() || isThinking}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default CoachChat;