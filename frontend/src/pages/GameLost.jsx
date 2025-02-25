import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const GameLost = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [finalStats, setFinalStats] = useState(null);
  
  useEffect(() => {
    // Get stats from location state if available
    if (location.state && location.state.gameStats) {
      setFinalStats(location.state.gameStats);
    }
    
    // Clean up any game data in localStorage
    const cleanupGame = () => {
      localStorage.removeItem('game_id');
    };
    
    return () => cleanupGame();
  }, [location]);
  
  const handleReturnHome = () => {
    navigate('/');
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-2xl w-full bg-black/30 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-gray-700">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6 text-red-500 drop-shadow-lg">
            Game Over
          </h1>
          
          <div className="mb-8">
            <div className="text-3xl font-bold mb-4">You're Out of Chips!</div>
            <p className="text-xl opacity-90">
              You've run out of chips and have been eliminated from the game.
              Better luck next time at the poker table!
            </p>
          </div>
          
          {finalStats && (
            <div className="bg-black/40 rounded-xl p-4 mb-8 text-left">
              <h2 className="text-xl font-bold mb-2 text-center">Final Game Stats</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>Starting Chips:</div>
                <div className="text-right">${finalStats.startingChips}</div>
                <div>Hands Played:</div>
                <div className="text-right">{finalStats.handsPlayed - 1}</div>
                <div>Hands Won:</div>
                <div className="text-right">{finalStats.handsWon}</div>
                <div>Best Hand:</div>
                <div className="text-right">{finalStats.bestHand || "None"}</div>
              </div>
            </div>
          )}
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Poker Tip:</h3>
            <p className="italic text-gray-300">
              {getRandomPokerTip()}
            </p>
          </div>
          
          <button 
            onClick={handleReturnHome}
            className="px-8 py-4 text-xl font-bold bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xl transition-all transform hover:scale-105"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Random poker tips to display
const getRandomPokerTip = () => {
  const tips = [
    "Position is power in poker. Playing from late position gives you more information and control.",
    "Don't play every hand. Being selective about your starting hands is key to long-term success.",
    "Pay attention to your opponents' betting patterns and tendencies.",
    "The best players know when to fold. Sometimes, saving your chips is the winning move.",
    "Manage your bankroll carefully. Never play with money you can't afford to lose.",
    "Bluffing is a tool, not a strategy. Use it sparingly and in the right situations.",
    "Mental focus is crucial. Avoid distractions and stay in the moment during play.",
    "Study and improve your game between sessions. Poker rewards continuous learning."
  ];
  
  return tips[Math.floor(Math.random() * tips.length)];
};

export default GameLost;