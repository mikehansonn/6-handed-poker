import React, { useState, useEffect, useRef } from 'react';
import api from './api'; 

const Recommendation = ({ setIsLoading }) => {
  const [advice, setAdvice] = useState('');
  const [action, setAction] = useState('');
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(() => {
    const hiddenState = localStorage.getItem("coach_hidden");
    return hiddenState ? JSON.parse(hiddenState) : false;
  });
  
  const fetchingRef = useRef(false);
  const lastGameStateRef = useRef(null);

  const actionStyles = {
    fold: "bg-red-500 text-white",
    check: "bg-blue-500 text-white",
    call: "bg-green-500 text-white",
    bet: "bg-yellow-500 text-white",
    raise: "bg-purple-500 text-white"
  };

  const toggleHiddenMode = () => {
    const newHiddenState = !isHidden;
    setIsHidden(newHiddenState);
    localStorage.setItem("coach_hidden", JSON.stringify(newHiddenState));
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

  if (isHidden) {
    return (
      <div className="bg-gray-800/80 w-72 backdrop-blur-sm text-white p-4 rounded-lg ml-4 shadow-lg border-l-4 border-gray-500">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center">
            <span className="mr-2 text-gray-400">♠</span>
            Coach Hidden
          </h2>
          <button 
            onClick={toggleHiddenMode} 
            className="text-gray-400 hover:text-white transition-colors text-sm bg-gray-700 px-2 py-1 rounded"
            title="Enable coach recommendations"
          >
            Show Coach
          </button>
        </div>
      </div>
    );
  }

  if (localIsLoading && !hasFetched) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm text-white p-4 rounded-lg ml-4 shadow-lg border-l-4 border-blue-500 animate-pulse w-96">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-5 h-5 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin mr-2"></div>
            <h2 className="text-lg font-bold">Coach Tip</h2>
          </div>
          <button 
            onClick={toggleHiddenMode} 
            className="text-gray-400 hover:text-white transition-colors text-sm bg-gray-700 px-2 py-1 rounded"
            title="Disable coach recommendations"
          >
            Hide Coach
          </button>
        </div>
        <p className="text-sm mt-2">Analyzing your hand...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm text-white p-4 rounded-lg ml-4 shadow-lg border-l-4 border-red-500 w-96">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold mb-2 text-red-400">Coach Unavailable</h2>
          <button 
            onClick={toggleHiddenMode} 
            className="text-gray-400 hover:text-white transition-colors text-sm bg-gray-700 px-2 py-1 rounded"
            title="Disable coach recommendations"
          >
            Hide Coach
          </button>
        </div>
        <p className="text-sm">Unable to get advice right now.</p>
      </div>
    );
  }

  if (hasFetched && !advice) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm text-white p-4 rounded-lg ml-4 shadow-lg border-l-4 border-yellow-500 w-96">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold mb-2">Coach Tip</h2>
          <button 
            onClick={toggleHiddenMode} 
            className="text-gray-400 hover:text-white transition-colors text-sm bg-gray-700 px-2 py-1 rounded"
            title="Disable coach recommendations"
          >
            Hide Coach
          </button>
        </div>
        <p className="text-sm">No recommendation for this situation.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm text-white p-4 rounded-lg ml-4 shadow-lg transition-all duration-300 border-l-4 border-green-500 w-96">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold flex items-center">
          <span className="mr-2 text-green-400">♠</span>
          Coach Tip
        </h2>
        <button 
          onClick={toggleHiddenMode} 
          className="text-gray-400 hover:text-white transition-colors text-sm bg-gray-700 px-2 py-1 rounded"
          title="Disable coach recommendations"
        >
          Hide
        </button>
      </div>
      
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
        className="text-sm whitespace-pre-line overflow-y-auto max-h-60"
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
  );
};

export default Recommendation;