// src/pages/ChooseBotCount.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChooseBotCount() {
  const [botCount, setBotCount] = useState(1);
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);

  const handleContinue = () => {
    // Pass the selected count via query parameter
    navigate(`/choose-bots?count=${botCount}`);
  };

  const handleInputChange = (e) => {
    const value = Number(e.target.value);
    // Keep value between 1-5
    if (value < 1) setBotCount(1);
    else if (value > 5) setBotCount(5);
    else setBotCount(value);
  };

  // For the card icon animations in background
  const cardSuits = ['♠', '♥', '♦', '♣'];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-4 sm:p-6 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute -inset-[10%] bg-gradient-radial from-emerald-500/10 via-transparent to-transparent blur-3xl"></div>
        
        {/* Animated playing card symbols */}
        <div className="overflow-hidden h-full w-full absolute">
          {cardSuits.flatMap((suit, suitIndex) => 
            [...Array(5)].map((_, i) => (
              <motion.div 
                key={`${suit}-${i}`}
                initial={{ 
                  x: Math.random() * 100 + '%', 
                  y: -50,
                  rotate: Math.random() * 360,
                  opacity: 0.05 + Math.random() * 0.1
                }}
                animate={{ 
                  y: ['0%', '100%'],
                  rotate: [0, 360],
                }}
                transition={{ 
                  duration: 15 + Math.random() * 20, 
                  repeat: Infinity, 
                  delay: Math.random() * 20,
                  ease: "linear"
                }}
                className="absolute text-4xl sm:text-5xl pointer-events-none"
                style={{
                  color: suit === '♥' || suit === '♦' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(248, 248, 248, 0.1)'
                }}
              >
                {suit}
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-xl w-full bg-gray-900/90 backdrop-blur-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-800 overflow-hidden"
      >
        {/* Glowing backgrounds */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"
        />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-10"
        >
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow"
          >
            Select Number of Bots
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg sm:text-xl text-gray-300 max-w-md mx-auto"
          >
            How many opponents would you like to play against?
          </motion.p>
        </motion.div>
        
        {/* Number Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-8 border border-gray-700/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-blue-600/5"></div>
          
          <div className="relative flex flex-col items-center">
            {/* Bot count visualizer */}
            <div className="mb-6 flex items-center justify-center gap-4 w-full">
              {[...Array(5)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: index < botCount ? 1 : 0.7,
                    opacity: index < botCount ? 1 : 0.3
                  }}
                  transition={{ duration: 0.2, delay: 0.05 * index }}
                  className={`h-12 w-12 rounded-full flex items-center justify-center text-xl ${
                    index < botCount 
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  <span className="text-lg">{index+1}</span>
                </motion.div>
              ))}
            </div>
            
            <div className="flex items-center gap-4 w-full max-w-xs justify-center mb-2">
              <button
                onClick={() => setBotCount(Math.max(1, botCount - 1))}
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <div className="relative w-full">
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={botCount}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border-2 border-gray-600 focus:border-emerald-500 rounded-lg py-2 px-4 text-center text-xl font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <div className="absolute top-0 right-0 bottom-0 flex items-center pr-2 pointer-events-none">
                  <span className="text-gray-400 text-sm font-normal">Max: 5</span>
                </div>
              </div>
              
              <button
                onClick={() => setBotCount(Math.min(5, botCount + 1))}
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            {/* Table visualization */}
            <div className="mt-6 relative">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-900 flex items-center justify-center border-4 border-emerald-700 shadow-lg">
                <div className="w-40 h-40 rounded-full bg-emerald-800 flex items-center justify-center border border-emerald-700/50">
                  <div className="relative w-full h-full">
                    {/* Player positions */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs shadow-lg">
                        You
                      </div>
                    </div>
                    
                    {/* Dynamic bot positions */}
                    <AnimatePresence>
                      {[...Array(botCount)].map((_, index) => {
                        // Calculate position around a circle
                        // Add a fixed offset to avoid overlapping with the player
                        const offset = 180; // Degrees offset from player position
                        const angleStep = 360 / (botCount + 1);
                        const angle = ((offset + index * angleStep) * Math.PI) / 180;
                        const radius = 40; // Distance from center (in percent) - increased to place bots at the edge
                        
                        // Calculate x,y coordinates on the circle
                        const left = 50 + radius * Math.sin(angle);
                        const top = 50 - radius * Math.cos(angle);
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute h-8 w-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white text-xs shadow-md border border-gray-600"
                            style={{
                              left: `${left}%`,
                              top: `${top}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            Bot {index + 1}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex justify-center"
        >
          <motion.button 
            onClick={handleContinue}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            className="relative px-10 py-4 text-xl font-bold rounded-xl shadow-xl overflow-hidden bg-gradient-to-r from-emerald-600 to-cyan-600 text-white w-full"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 opacity-50 animate-pulse"></div>
            <div className="relative flex items-center justify-center gap-2">
              <span>Continue</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Button hover effect */}
            <AnimatePresence>
              {isHovering && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10"
                />
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}