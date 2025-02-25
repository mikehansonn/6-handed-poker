import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const GameWon = () => {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-800 to-green-600 text-white p-6">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6 text-yellow-300 drop-shadow-lg animate-pulse">
            Congratulations!
          </h1>
          
          <div className="mb-8">
            <div className="text-3xl font-bold mb-4">You Won The Game!</div>
            <p className="text-xl opacity-90">
              You're the last player standing with chips remaining. 
              Your poker skills have triumphed over your opponents!
            </p>
          </div>
          
          {finalStats && (
            <div className="bg-black/20 rounded-xl p-4 mb-8 text-left">
              <h2 className="text-xl font-bold mb-2 text-center">Final Game Stats</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>Starting Chips:</div>
                <div className="text-right">${finalStats.startingChips}</div>
                <div>Final Chips:</div>
                <div className="text-right font-bold text-yellow-300">${finalStats.finalChips}</div>
                <div>Hands Played:</div>
                <div className="text-right">{finalStats.handsPlayed - 1}</div>
                <div>Hands Won:</div>
                <div className="text-right">{finalStats.handsWon}</div>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleReturnHome}
            className="px-8 py-4 text-xl font-bold bg-yellow-500 hover:bg-yellow-400 text-yellow-900 rounded-xl shadow-xl transition-all transform hover:scale-105"
          >
            Return to Home
          </button>
        </div>
      </div>
      
      {/* Animated celebration elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          >
            <div className="text-5xl">🏆</div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        .animate-float {
          animation: float 10s ease-in forwards infinite;
        }
      `}</style>
    </div>
  );
};

export default GameWon;