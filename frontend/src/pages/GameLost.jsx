import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const GameLost = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [finalStats, setFinalStats] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isAnalyticsHovering, setIsAnalyticsHovering] = useState(false);
  
  useEffect(() => {
    const loadStatsFromLocalStorage = () => {
      const totalHandsPlayed = parseInt(localStorage.getItem("total_hands_played")) || 0;
      const totalHandsWon = parseInt(localStorage.getItem("total_hands_won")) || 0;
      const totalMoneyWon = parseInt(localStorage.getItem("total_money_won")) || 0;
      const sessionHandsPlayed = JSON.parse(localStorage.getItem("session_hands_played")) || [];
      const sessionHandsWon = JSON.parse(localStorage.getItem("session_hands_won")) || [];
      
      setFinalStats({
        startingChips: 200,
        handsPlayed: sessionHandsPlayed[0] || 0,
        handsWon: sessionHandsWon[0] || 0,
        totalHandsPlayed,
        totalHandsWon,
        totalMoneyWon,
      });
    };
    
    loadStatsFromLocalStorage();

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-2xl w-full bg-black/30 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-gray-700">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6 text-red-500 drop-shadow-lg">
            Game Over
          </h1>
          
          <div className="mb-8">
            <div className="text-3xl font-bold mb-4">You're Out of Chips!</div>
            <p className="text-xl opacity-90 mb-4">
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
                <div className="text-right">{finalStats.handsPlayed}</div>
                <div>Hands Won:</div>
                <div className="text-right">{finalStats.handsWon}</div>
                <div>Total Career Hands:</div>
                <div className="text-right">{finalStats.totalHandsPlayed}</div>
                <div>Total Career Wins:</div>
                <div className="text-right">{finalStats.totalHandsWon}</div>
                <div>Total Career Profit:</div>
                <div className={`text-right ${finalStats.totalMoneyWon >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${finalStats.totalMoneyWon}
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Poker Tip:</h3>
            <p className="italic text-gray-300">
              {getRandomPokerTip()}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button 
              onClick={handleReturnHome}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              className="relative px-8 py-4 text-lg font-bold rounded-xl shadow-xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-1"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-indigo-600/40 opacity-50 animate-pulse"></div>
              <div className="relative flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span>Return Home</span>
              </div>

              <AnimatePresence>
                {isHovering && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-400/10"
                  />
                )}
              </AnimatePresence>
            </motion.button>

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
    </div>
  );
};

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