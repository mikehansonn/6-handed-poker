import React, { useState, useEffect, useRef } from 'react';
import api from './api';

const UnifiedCoach = ({ setIsLoading }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const [advice, setAdvice] = useState('');
  const [action, setAction] = useState('');
  const [error, setError] = useState(null);

  const [isExpanded, setIsExpanded] = useState(() => {
    const savedState = localStorage.getItem("coach_expanded");
    return savedState ? JSON.parse(savedState) : false;
  });
  const [isHidden, setIsHidden] = useState(() => {
    const hiddenState = localStorage.getItem("coach_hidden");
    return hiddenState ? JSON.parse(hiddenState) : false;
  });
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("coach_active_tab");
    return savedTab || "recommendation";
  });
  const [isThinking, setIsThinking] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [localIsLoading, setLocalIsLoading] = useState(false);

  const fetchingRef = useRef(false);
  const lastGameStateRef = useRef(null);

  const actionStyles = {
    fold: "bg-red-500 text-white",
    check: "bg-blue-500 text-white",
    call: "bg-green-500 text-white",
    bet: "bg-yellow-500 text-white",
    raise: "bg-purple-500 text-white"
  };

  const handleExpandToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem("coach_expanded", JSON.stringify(newState));
  };

  const toggleHiddenMode = () => {
    const newHiddenState = !isHidden;
    setIsHidden(newHiddenState);
    localStorage.setItem("coach_hidden", JSON.stringify(newHiddenState));
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("coach_active_tab", tab);
  };

  const getCurrentGameState = () => {
    try {
      const historyState = window.history.state?.usr?.gameState;
      if (historyState) return JSON.stringify(historyState);
      
      const gameIdObj = JSON.parse(localStorage.getItem("game_id"));
      return gameIdObj?.gameState ? JSON.stringify(gameIdObj.gameState) : null;
    } catch (err) {
      console.error("Error getting game state:", err);
      return null;
    }
  };

  useEffect(() => {
    if (setIsLoading) {
      setIsLoading(localIsLoading);
    }
  }, [localIsLoading, setIsLoading]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  useEffect(() => {
    if (messages.length === 0 && !isHidden) {
      setMessages([{
        id: Date.now(),
        sender: 'coach',
        text: "Hi there! I'm your poker coach. Ask me any questions about the game, strategy, or your current hand."
      }]);
    }
  }, [messages.length, isHidden]);

  useEffect(() => {
    const fetchAdvice = async () => {
      if (fetchingRef.current || isHidden) {
        return;
      }

      const localGameIdObj = JSON.parse(localStorage.getItem("game_id"));
      const gameId = localGameIdObj?.value || null;
      
      if (!gameId) {
        console.log("No gameId found in localStorage.");
        setHasFetched(true);
        return;
      }
      
      const currentGameState = getCurrentGameState();
      
      if (currentGameState && currentGameState === lastGameStateRef.current) {
        return;
      }
      
      fetchingRef.current = true;
      lastGameStateRef.current = currentGameState;
      
      setLocalIsLoading(true);
      window.dispatchEvent(new Event('recommendationLoadingStart'));

      try {
        const response = await api.post("/games/coach-recommendation", {
          game_id: gameId
        });
        const data = await response.data;
        
        setAdvice(data.advice.coach_tip || "");
        setAction(data.advice.action || "");
        setError(null);
      } catch (err) {
        console.error("Error fetching advice:", err);
        setError(err.message);
      } finally {
        setHasFetched(true);
        setLocalIsLoading(false);
        window.dispatchEvent(new Event('recommendationLoadingEnd'));
        fetchingRef.current = false;
      }
    };

    fetchAdvice();
    
    const handleGameStateUpdate = () => {
      fetchAdvice();
    };
    
    window.addEventListener('gameStateUpdated', handleGameStateUpdate);
    
    return () => {
      window.removeEventListener('gameStateUpdated', handleGameStateUpdate);
    };
  }, [isHidden]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    if (!isExpanded) {
      setIsExpanded(true);
      localStorage.setItem("coach_expanded", JSON.stringify(true));
    }

    if (activeTab !== "chat") {
      switchTab("chat");
    }
    
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputValue
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    window.dispatchEvent(new Event('coachLoadingStart'));
    if (setIsLoading) setIsLoading(true);
    setIsThinking(true); 
    
    const localGameIdObj = JSON.parse(localStorage.getItem("game_id"));
    const gameId = localGameIdObj?.value || null;
    
    if (!gameId) {
      if (setIsLoading) setIsLoading(false);
      setIsThinking(false);
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
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'system',
        text: "Sorry, I couldn't process your question right now."
      }]);
    } finally {
      if (setIsLoading) setIsLoading(false);
      setIsThinking(false); 
      window.dispatchEvent(new Event('coachLoadingEnd'));
    }
  };

  if (isHidden) {
    return (
      <div className="bg-gray-800/80 w-96 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg border-l-4 border-gray-500">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center">
            <span className="mr-2 text-gray-400">♠</span>
            Coach Hidden
          </h2>
          <button 
            onClick={toggleHiddenMode} 
            className="text-gray-400 hover:text-white transition-colors text-sm bg-gray-700 px-2 py-1 rounded"
            title="Enable coach"
          >
            Show Coach
          </button>
        </div>
      </div>
    );
  }

  if (localIsLoading && !hasFetched && activeTab === "recommendation") {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg border-l-4 border-blue-500 animate-pulse w-96">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-5 h-5 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin mr-2"></div>
            <h2 className="text-lg font-bold">Coach Tip</h2>
          </div>
          <button 
            onClick={toggleHiddenMode} 
            className="text-gray-400 hover:text-white transition-colors text-sm bg-gray-700 px-2 py-1 rounded"
            title="Disable coach"
          >
            Hide Coach
          </button>
        </div>
        <p className="text-sm mt-2">Analyzing your hand...</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/80 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg border-l-4 ${
      error ? 'border-red-500' : 
      activeTab === 'recommendation' ? 'border-green-500' : 'border-blue-500'
    } transition-all duration-300 flex flex-col w-96 ${isExpanded ? 'h-[500px]' : 'h-auto'}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => switchTab("recommendation")}
            className={`px-3 py-1 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "recommendation" 
                ? "bg-green-500/30 text-white" 
                : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Tips
          </button>
          <button 
            onClick={() => switchTab("chat")}
            className={`px-3 py-1 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "chat" 
                ? "bg-blue-500/30 text-white" 
                : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Chat
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleExpandToggle} 
            className="text-gray-400 hover:text-white transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
          <button 
            onClick={toggleHiddenMode} 
            className="text-gray-400 hover:text-white transition-colors text-sm"
            title="Hide coach"
          >
            ✕
          </button>
        </div>
      </div>

      {activeTab === "recommendation" && (
        <div className={`${isExpanded ? 'flex-1 flex flex-col' : ''}`}>
          {error ? (
            <div className="p-2">
              <h3 className="text-red-400 font-bold">Coach Unavailable</h3>
              <p className="text-sm mt-1">Unable to get advice right now.</p>
            </div>
          ) : hasFetched && !advice ? (
            <div className="p-2">
              <p className="text-sm">No recommendation for this situation.</p>
            </div>
          ) : (
            <div className={`${isExpanded ? 'flex-1 flex flex-col' : ''}`}>
              {action && (
                <div className="mb-2">
                  <span className="text-sm font-medium mr-2">Recommended:</span>
                  <span 
                    className={`${actionStyles[action.toLowerCase()] || 'bg-gray-600 text-white'} px-3 py-1 rounded-md uppercase text-xs font-bold`}
                  >
                    {action}
                  </span>
                </div>
              )}
              
              <div 
                className={`text-sm whitespace-pre-line overflow-y-auto ${isExpanded ? 'flex-1' : 'max-h-32'}`}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(74, 222, 128, 0.5) rgba(31, 41, 55, 0.3)'
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
                    background: rgba(74, 222, 128, 0.5);
                    border-radius: 10px;
                    transition: background 0.2s ease;
                  }
                  
                  div::-webkit-scrollbar-thumb:hover {
                    background: rgba(74, 222, 128, 0.8);
                  }
                `}</style>
                {advice}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "chat" && (
        <>
          <div 
            className={`overflow-y-auto space-y-3 ${isExpanded ? 'flex-1' : 'max-h-32'}`}
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

          <form onSubmit={handleSubmit} className="flex mt-3">
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
        </>
      )}
    </div>
  );
};

export default UnifiedCoach;