import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const GameWon = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [finalStats, setFinalStats] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isAnalyticsHovering, setIsAnalyticsHovering] = useState(false);
  
  useEffect(() => {
    // Load stats from localStorage instead of relying on location state
    const loadStatsFromLocalStorage = () => {
      const totalHandsPlayed = parseInt(localStorage.getItem("total_hands_played")) || 0;
      const totalHandsWon = parseInt(localStorage.getItem("total_hands_won")) || 0;
      const totalMoneyWon = parseInt(localStorage.getItem("total_money_won")) || 0;
      const sessionHandsPlayed = JSON.parse(localStorage.getItem("session_hands_played")) || [];
      const sessionHandsWon = JSON.parse(localStorage.getItem("session_hands_won")) || [];
      const sessionMoneyWon = JSON.parse(localStorage.getItem("session_money_won")) || [];
      
      setFinalStats({
        startingChips: 200, // Default starting value
        finalChips: totalMoneyWon, // Use the most recent money count
        handsPlayed: sessionHandsPlayed[0] || 0,
        handsWon: sessionHandsWon[0] || 0,
        sessionProfit: sessionMoneyWon[0] || 0,
        totalHandsPlayed,
        totalHandsWon,
        totalMoneyWon
      });
    };
    
    loadStatsFromLocalStorage();
    
    // Clean up any game data in localStorage
    const cleanupGame = () => {
      localStorage.removeItem('game_id');
    };
    
    return () => cleanupGame();
  }, [location]);
  
  const handleReturnHome = () => {
    navigate('/');
  };
  
  const handleViewAnalytics = () => {
    navigate('/analytics');
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
            <p className="text-xl opacity-90 mb-4">
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
                <div className="text-right">{finalStats.handsPlayed}</div>
                <div>Hands Won:</div>
                <div className="text-right">{finalStats.handsWon}</div>
                <div>Session Profit:</div>
                <div className={`text-right ${finalStats.sessionProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  ${finalStats.sessionProfit}
                </div>
                <div>Total Career Hands:</div>
                <div className="text-right">{finalStats.totalHandsPlayed}</div>
                <div>Total Career Wins:</div>
                <div className="text-right">{finalStats.totalHandsWon}</div>
              </div>
            </div>
          )}
          
          {/* Navigation buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {/* Return Home button */}
            <motion.button 
              onClick={handleReturnHome}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(234, 179, 8, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              className="relative px-8 py-4 text-lg font-bold rounded-xl shadow-xl overflow-hidden bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-900 flex-1"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/40 to-yellow-600/40 opacity-50 animate-pulse"></div>
              <div className="relative flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span>Return Home</span>
              </div>
              
              {/* Button hover effect */}
              <AnimatePresence>
                {isHovering && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-yellow-500/10"
                  />
                )}
              </AnimatePresence>
            </motion.button>

            {/* View Analytics button */}
            <motion.button 
              onClick={handleViewAnalytics}
              onMouseEnter={() => setIsAnalyticsHovering(true)}
              onMouseLeave={() => setIsAnalyticsHovering(false)}
              whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              className="relative px-8 py-4 text-lg font-bold rounded-xl shadow-xl overflow-hidden bg-gradient-to-r from-emerald-600 to-cyan-600 text-white flex-1"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 opacity-50 animate-pulse"></div>
              <div className="relative flex items-center justify-center gap-2">
                <span>View Analytics</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              
              {/* Button hover effect */}
              <AnimatePresence>
                {isAnalyticsHovering && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          </div>
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